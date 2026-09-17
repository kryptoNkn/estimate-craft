//! HTTP API аутентификации: register, login, refresh, logout, logout-all,
//! смена и сброс пароля, /me.
//! Хендлер тонкий: валидация тела → сервис/репозиторий → JSON.
//! Роль в ответе берётся из БД, не из JWT.

use axum::{
    Json,
    extract::State,
    http::StatusCode,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use validator::Validate;

use crate::{
    error::AppError,
    extractors::auth::AuthUser,
    models::user::UserResponse,
    rate_limit::auth_sensitive_layer,
    repositories::{
        password_reset::PasswordResetRepository,
        session::SessionRepository,
        user::UserRepository,
    },
    services::{
        jwt::{create_access_token, hash_refresh_token, new_refresh_token, JwtKeys},
        password::{
            dummy_password_hash, hash_password, validate_password, verify_password,
        },
    },
    state::AppState,
};

#[derive(Deserialize, Validate)]
pub struct RegisterRequest {
    #[validate(email(message = "Invalid email"))]
    pub email: String,
    #[validate(custom(function = "validate_password"))]
    pub password: String,
}

#[derive(Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(email(message = "Invalid email"))]
    pub email: String,
    #[validate(length(min = 1, max = 128, message = "Password must be at most 128 characters"))]
    pub password: String,
}

#[derive(Serialize)]
pub struct TokenResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub token_type: &'static str,
    pub expires_in: u64,
    pub user: UserResponse,
}

#[derive(Deserialize, Validate)]
pub struct RefreshRequest {
    #[validate(length(min = 1, message = "Refresh token is required"))]
    pub refresh_token: String,
}

#[derive(Deserialize, Validate)]
pub struct LogoutRequest {
    #[validate(length(min = 1, message = "Refresh token is required"))]
    pub refresh_token: String,
}

#[derive(Deserialize, Validate)]
pub struct ChangePasswordRequest {
    #[validate(length(min = 1, max = 128, message = "Password must be at most 128 characters"))]
    pub current_password: String,
    #[validate(custom(function = "validate_password"))]
    pub new_password: String,
}

#[derive(Deserialize, Validate)]
pub struct ForgotPasswordRequest {
    #[validate(email(message = "Invalid email"))]
    pub email: String,
}

#[derive(Deserialize, Validate)]
pub struct ResetPasswordRequest {
    #[validate(length(min = 1, max = 128, message = "Reset token is required"))]
    pub token: String,
    #[validate(custom(function = "validate_password"))]
    pub password: String,
}

pub fn routes(rate_limit: bool) -> Router<AppState> {
    let sensitive = Router::new()
        .route("/register", post(register))
        .route("/login", post(login))
        .route("/refresh", post(refresh))
        .route("/change-password", post(change_password))
        .route("/forgot-password", post(forgot_password))
        .route("/reset-password", post(reset_password));

    let sensitive = if rate_limit {
        sensitive.layer(auth_sensitive_layer())
    } else {
        sensitive
    };

    let rest = Router::new()
        .route("/logout", post(logout))
        .route("/logout-all", post(logout_all))
        .route("/me", get(me));

    sensitive.merge(rest)
}

fn jwt_keys(state: &AppState) -> JwtKeys<'_> {
    JwtKeys {
        secret: &state.jwt_secret,
        issuer: &state.jwt_issuer,
        audience: &state.jwt_audience,
        access_expires_in_secs: state.jwt_access_expires_in_secs,
    }
}

async fn issue_tokens(
    state: &AppState,
    user: crate::models::user::User,
) -> Result<TokenResponse, AppError> {
    let access_token = create_access_token(&user, &jwt_keys(state))?;
    let refresh_token = new_refresh_token();

    SessionRepository::create_refresh(
        &state.db,
        user.id,
        &hash_refresh_token(&refresh_token),
        state.jwt_refresh_expires_in_secs,
    )
    .await?;

    Ok(TokenResponse {
        access_token,
        refresh_token,
        token_type: "Bearer",
        expires_in: state.jwt_access_expires_in_secs,
        user: user.into_response(),
    })
}

async fn register(
    State(state): State<AppState>,
    Json(body): Json<RegisterRequest>,
) -> Result<(StatusCode, Json<UserResponse>), AppError> {
    body.validate()?;

    let password_hash = hash_password(&body.password)?;
    let user = UserRepository::create_user(&state.db, &body.email, &password_hash).await?;

    Ok((StatusCode::CREATED, Json(user.into_response())))
}

async fn login(
    State(state): State<AppState>,
    Json(body): Json<LoginRequest>,
) -> Result<Json<TokenResponse>, AppError> {
    body.validate()?;

    let user = UserRepository::find_by_email(&state.db, &body.email).await?;
    let password_hash = user
        .as_ref()
        .map(|user| user.password_hash.as_str())
        .unwrap_or_else(|| dummy_password_hash());
    let password_ok = verify_password(&body.password, password_hash)?;

    let Some(user) = user.filter(|_| password_ok) else {
        return Err(AppError::Unauthorized("invalid credentials".into()));
    };

    Ok(Json(issue_tokens(&state, user).await?))
}

async fn change_password(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(body): Json<ChangePasswordRequest>,
) -> Result<Json<TokenResponse>, AppError> {
    body.validate()?;

    let user = UserRepository::find_by_id(&state.db, auth.user_id)
        .await?
        .ok_or_else(|| AppError::Unauthorized("user not found".into()))?;

    if !verify_password(&body.current_password, &user.password_hash)? {
        return Err(AppError::Validation("Current password is incorrect".into()));
    }

    if body.current_password == body.new_password {
        return Err(AppError::Validation(
            "New password must be different from the current password".into(),
        ));
    }

    let password_hash = hash_password(&body.new_password)?;
    let user = UserRepository::update_password(&state.db, auth.user_id, &password_hash).await?;

    SessionRepository::denylist_access(&state.db, auth.jti, auth.exp).await?;
    SessionRepository::revoke_all_refresh(&state.db, auth.user_id).await?;

    Ok(Json(issue_tokens(&state, user).await?))
}

async fn forgot_password(
    State(state): State<AppState>,
    Json(body): Json<ForgotPasswordRequest>,
) -> Result<StatusCode, AppError> {
    body.validate()?;

    if let Some(user) = UserRepository::find_by_email(&state.db, &body.email).await? {
        PasswordResetRepository::invalidate_unused(&state.db, user.id).await?;

        let raw_token = new_refresh_token();
        PasswordResetRepository::create(
            &state.db,
            user.id,
            &hash_refresh_token(&raw_token),
            state.password_reset_expires_in_secs,
        )
        .await?;

        let origin = state.frontend_origin.trim_end_matches('/');
        let reset_url = format!("{origin}/auth/reset-password?token={raw_token}");
        state
            .mailer
            .send_password_reset(&user.email, &reset_url)
            .await?;
    }

    Ok(StatusCode::NO_CONTENT)
}

async fn reset_password(
    State(state): State<AppState>,
    Json(body): Json<ResetPasswordRequest>,
) -> Result<Json<TokenResponse>, AppError> {
    body.validate()?;

    let hash = hash_refresh_token(&body.token);
    let reset = PasswordResetRepository::find_active(&state.db, &hash)
        .await?
        .ok_or_else(|| AppError::Validation("invalid or expired reset token".into()))?;

    let password_hash = hash_password(&body.password)?;
    let user = UserRepository::update_password(&state.db, reset.user_id, &password_hash).await?;

    PasswordResetRepository::mark_used(&state.db, reset.id).await?;
    PasswordResetRepository::invalidate_unused(&state.db, reset.user_id).await?;
    SessionRepository::revoke_all_refresh(&state.db, reset.user_id).await?;

    Ok(Json(issue_tokens(&state, user).await?))
}

async fn refresh(
    State(state): State<AppState>,
    Json(body): Json<RefreshRequest>,
) -> Result<Json<TokenResponse>, AppError> {
    body.validate()?;

    let hash = hash_refresh_token(&body.refresh_token);
    let session = SessionRepository::find_active_refresh(&state.db, &hash)
        .await?
        .ok_or_else(|| AppError::Unauthorized("invalid credentials".into()))?;

    SessionRepository::revoke_refresh(&state.db, session.id).await?;

    let user = UserRepository::find_by_id(&state.db, session.user_id)
        .await?
        .ok_or_else(|| AppError::Unauthorized("user not found".into()))?;

    Ok(Json(issue_tokens(&state, user).await?))
}

async fn logout(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(body): Json<LogoutRequest>,
) -> Result<StatusCode, AppError> {
    body.validate()?;

    SessionRepository::denylist_access(&state.db, auth.jti, auth.exp).await?;

    let hash = hash_refresh_token(&body.refresh_token);
    if let Some(session) = SessionRepository::find_active_refresh(&state.db, &hash).await? {
        if session.user_id == auth.user_id {
            SessionRepository::revoke_refresh(&state.db, session.id).await?;
        }
    }

    Ok(StatusCode::NO_CONTENT)
}

async fn logout_all(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<StatusCode, AppError> {
    SessionRepository::denylist_access(&state.db, auth.jti, auth.exp).await?;
    SessionRepository::revoke_all_refresh(&state.db, auth.user_id).await?;
    UserRepository::bump_token_version(&state.db, auth.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn me(auth: AuthUser) -> Result<Json<UserResponse>, AppError> {
    Ok(Json(UserResponse {
        id: auth.user_id,
        email: auth.email,
        role: auth.role,
        created_at: auth.created_at,
    }))
}
