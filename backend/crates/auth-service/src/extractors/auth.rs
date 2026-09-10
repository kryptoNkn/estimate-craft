//! Экстрактор `AuthUser`: без валидного access JWT хендлер даже не вызовется.
//! После подписи проверяем denylist и `token_version`; `role` — из строки users.

use axum::{
    extract::FromRequestParts,
    http::{header::AUTHORIZATION, request::Parts},
};
use uuid::Uuid;

use chrono::{DateTime, Utc};

use crate::{
    error::AppError,
    repositories::{session::SessionRepository, user::UserRepository},
    services::jwt::{verify_access_token, JwtKeys},
    state::AppState,
};

pub struct AuthUser {
    pub user_id: Uuid,
    pub email: String,
    pub role: String,
    pub jti: Uuid,
    pub exp: usize,
    pub created_at: DateTime<Utc>,
}

impl FromRequestParts<AppState> for AuthUser {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get(AUTHORIZATION)
            .and_then(|value| value.to_str().ok())
            .ok_or_else(|| AppError::Unauthorized("missing authorization header".into()))?;

        let token = auth_header
            .strip_prefix("Bearer ")
            .ok_or_else(|| AppError::Unauthorized("invalid authorization header".into()))?;

        let keys = JwtKeys {
            secret: &state.jwt_secret,
            issuer: &state.jwt_issuer,
            audience: &state.jwt_audience,
            access_expires_in_secs: state.jwt_access_expires_in_secs,
        };

        let claims = verify_access_token(token, &keys)?;

        let jti = Uuid::parse_str(&claims.jti)
            .map_err(|_| AppError::Unauthorized("invalid token".into()))?;
        let user_id = Uuid::parse_str(&claims.sub)
            .map_err(|_| AppError::Unauthorized("invalid token".into()))?;

        if SessionRepository::is_access_denied(&state.db, jti).await? {
            return Err(AppError::Unauthorized("token revoked".into()));
        }

        let user = UserRepository::find_by_id(&state.db, user_id)
            .await?
            .ok_or_else(|| AppError::Unauthorized("user not found".into()))?;

        if claims.ver != user.token_version {
            return Err(AppError::Unauthorized("token revoked".into()));
        }

        Ok(Self {
            user_id: user.id,
            email: user.email,
            role: user.role,
            jti,
            exp: claims.exp,
            created_at: user.created_at,
        })
    }
}