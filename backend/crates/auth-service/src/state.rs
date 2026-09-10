//! Общее состояние приложения: пул БД и параметры JWT.
//! Клонируется в каждый хендлер через `State<AppState>`.
//! Сюда не класть request-специфичные данные.

use sqlx::PgPool;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub jwt_secret: String,
    pub jwt_issuer: String,
    pub jwt_audience: String,
    pub jwt_access_expires_in_secs: u64,
    pub jwt_refresh_expires_in_secs: u64,
    pub cors_allowed_origin: String,
}