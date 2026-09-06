use axum::{
    Json,
    extract::State,
    http::StatusCode,
    routing::post,
    Router,
};
use serde::{Deserialize, Serialize};
use validator::Validate;

use crate::{
    error::AppError,
    models::user::UserResponse,
    repositories::user::UserRepository,
    services::{
        jwt::create_token,
        password::{hash_password, verify_password},
    },
    state::AppState,
};

#[derive(Deserialize, Validate, Debug)]
pub struct RegisterRequest {
    #[validate(email(message = "Invalid email"))]
    pub email: String,
    #[validate(length(min = 8, message = "Password must be at least 8 characters"))]
    pub password: String,
}

#[derive(Deserialize, Validate, Debug)]
pub struct LoginRequest {
    #[validate(email(message = "Invalid email"))]
    pub email: String,
    #[validate(length(min = 1, message = "Password is required"))]
    pub password: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
    pub access_token: String,
    pub token_type: &'static str,
    pub expires_in: u64,
    pub user: UserResponse,
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/register", post(register))
        .route("/login", post(login))
}

async fn register(
    State(state): State<AppState>,
    Json(body): Json<RegisterRequest>,
) -> Result<(StatusCode, Json<UserResponse>), AppError> {
    body.validate()?;

    let password_hash = hash_password(&body.password)?;

    let user = UserRepository::create_user(
        &state.db,
        &body.email,
        &password_hash,
    )
    .await?;

    Ok((StatusCode::CREATED, Json(user.into_response())))
}

async fn login(
    State(state): State<AppState>,
    Json(body): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, AppError> {
    body.validate()?;

    let user = UserRepository::find_by_email(&state.db, &body.email).await?;

    let user = match user {
        Some(user) if verify_password(&body.password, &user.password_hash)? => user,
        _ => return Err(AppError::Unauthorized("invalid credentials".into())),
    };

    let access_token = create_token(
        &user,
        &state.jwt_secret,
        state.jwt_expires_in_secs,
    )?;

    Ok(Json(LoginResponse {
        access_token,
        token_type: "Bearer",
        expires_in: state.jwt_expires_in_secs,
        user: user.into_response(),
    }))
}
