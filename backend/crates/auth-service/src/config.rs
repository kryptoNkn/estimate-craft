//! Конфиг из переменных окружения.
//! Секреты (`DATABASE_URL`, `JWT_SECRET`) живут только здесь и в `AppState`.
//! `Debug` специально маскирует их — не логируй env «как есть».

use std::env;
use std::fmt;

#[derive(Clone)]
pub struct Config {
    pub server_host: String,
    pub server_port: u16,
    pub database_url: String,
    pub jwt_secret: String,
    pub jwt_issuer: String,
    pub jwt_audience: String,
    pub jwt_access_expires_in_secs: u64,
    pub jwt_refresh_expires_in_secs: u64,
    pub cors_allowed_origin: String,
}

impl fmt::Debug for Config {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Config")
            .field("server_host", &self.server_host)
            .field("server_port", &self.server_port)
            .field("database_url", &"[redacted]")
            .field("jwt_secret", &"[redacted]")
            .field("jwt_issuer", &self.jwt_issuer)
            .field("jwt_audience", &self.jwt_audience)
            .field("jwt_access_expires_in_secs", &self.jwt_access_expires_in_secs)
            .field("jwt_refresh_expires_in_secs", &self.jwt_refresh_expires_in_secs)
            .field("cors_allowed_origin", &self.cors_allowed_origin)
            .finish()
    }
}

impl Config {
    pub fn from_env() -> Result<Self, env::VarError> {
        let server_host = env::var("SERVER_HOST")?;
        let server_port = env::var("SERVER_PORT")
            .unwrap_or_else(|_| "8001".to_string())
            .parse()
            .expect("SERVER_PORT must be a valid u16");

        Ok(Self {
            server_host,
            server_port,
            database_url: env::var("DATABASE_URL")?,
            jwt_secret: env::var("JWT_SECRET")?,
            jwt_issuer: env::var("JWT_ISSUER")
                .unwrap_or_else(|_| "constructor-wm-auth".to_string()),
            jwt_audience: env::var("JWT_AUDIENCE")
                .unwrap_or_else(|_| "constructor-wm-web".to_string()),
            jwt_access_expires_in_secs: env::var("JWT_ACCESS_EXPIRES_IN_SECS")
                .unwrap_or_else(|_| "900".to_string())
                .parse()
                .expect("JWT_ACCESS_EXPIRES_IN_SECS must be a valid u64"),
            jwt_refresh_expires_in_secs: env::var("JWT_REFRESH_EXPIRES_IN_SECS")
                .unwrap_or_else(|_| "604800".to_string())
                .parse()
                .expect("JWT_REFRESH_EXPIRES_IN_SECS must be a valid u64"),
            cors_allowed_origin: env::var("CORS_ALLOWED_ORIGIN")
                .unwrap_or_else(|_| "http://localhost:3000".to_string()),
        })
    }
}