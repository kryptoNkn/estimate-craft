use sqlx::PgPool;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub jwt_secret: String,
    pub jwt_expires_in_secs: u64,
    pub cors_allowed_origin: String,
}