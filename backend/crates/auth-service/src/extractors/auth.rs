use axum::{
    extract::FromRequestParts,
    http::{header::AUTHORIZATION, request::Parts},
};
use uuid::Uuid;

use crate::{
    error::AppError,
    services::jwt::verify_token,
    state::AppState,
};

/// данные авторизованного пользователя из JWT
pub struct AuthUser {
    pub user_id: Uuid,
    pub email: String,
    pub role: String,
}

impl FromRequestParts<AppState> for AuthUser {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        // 1. чтение заголовка Authorization
        let auth_header = parts
            .headers
            .get(AUTHORIZATION)
            .and_then(|value| value.to_str().ok())
            .ok_or_else(|| AppError::Unauthorized("missing authorization header".into()))?;

        // 2. вырез "Bearer "
        let token = auth_header
            .strip_prefix("Bearer ")
            .ok_or_else(|| AppError::Unauthorized("invalid authorization header".into()))?;

        // проверка JWT
        let claims = verify_token(token, &state.jwt_secret)?;

        // парсинг user id
        let user_id = Uuid::parse_str(&claims.sub)
            .map_err(|_| AppError::Unauthorized("invalid token".into()))?;

        Ok(Self {
            user_id,
            email: claims.email,
            role: claims.role,
        })
    }
}