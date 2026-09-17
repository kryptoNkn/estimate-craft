//! Конфиг из переменных окружения.
//! Секреты (`DATABASE_URL`, `JWT_SECRET`) живут только здесь и в `AppState`.
//! `Debug` специально маскирует их — не логируй env «как есть».

use std::env;
use std::fmt;

const MIN_JWT_SECRET_LEN: usize = 32;
const EXAMPLE_JWT_SECRET: &str = "dev-secret-change-in-production-min-32-chars";

#[derive(Debug)]
pub struct ConfigError(String);

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl std::error::Error for ConfigError {}

impl From<env::VarError> for ConfigError {
    fn from(err: env::VarError) -> Self {
        Self(err.to_string())
    }
}

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
    pub frontend_origin: String,
    pub password_reset_expires_in_secs: u64,
    pub session_cleanup_interval_secs: u64,
    pub is_production: bool,
    pub trust_proxy: bool,
    pub smtp: SmtpSettings,
}

#[derive(Clone)]
pub struct SmtpSettings {
    pub host: Option<String>,
    pub port: u16,
    /// `starttls` (587), `tls` (465), `none` (Mailpit / внутренний relay).
    pub tls: String,
    pub username: Option<String>,
    pub password: Option<String>,
    pub from: Option<String>,
    pub required: bool,
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
            .field("frontend_origin", &self.frontend_origin)
            .field(
                "password_reset_expires_in_secs",
                &self.password_reset_expires_in_secs,
            )
            .field(
                "session_cleanup_interval_secs",
                &self.session_cleanup_interval_secs,
            )
            .field("is_production", &self.is_production)
            .field("trust_proxy", &self.trust_proxy)
            .field("smtp_host", &self.smtp.host)
            .field("smtp_port", &self.smtp.port)
            .field("smtp_tls", &self.smtp.tls)
            .field("smtp_username", &self.smtp.username)
            .field("smtp_password", &"[redacted]")
            .field("smtp_from", &self.smtp.from)
            .finish()
    }
}

fn optional_env(key: &str) -> Option<String> {
    env::var(key)
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

pub fn is_production() -> bool {
    env::var("APP_ENV")
        .or_else(|_| env::var("RUST_ENV"))
        .map(|value| {
            value.eq_ignore_ascii_case("production") || value.eq_ignore_ascii_case("prod")
        })
        .unwrap_or(false)
}

fn validate_jwt_secret(secret: &str) -> Result<(), ConfigError> {
    if secret.len() < MIN_JWT_SECRET_LEN {
        return Err(ConfigError(format!(
            "JWT_SECRET must be at least {MIN_JWT_SECRET_LEN} characters"
        )));
    }

    if secret == EXAMPLE_JWT_SECRET {
        return Err(ConfigError(
            "JWT_SECRET is the documented example value; generate a unique secret".into(),
        ));
    }

    let lowered = secret.to_ascii_lowercase();
    if is_production()
        && (lowered.contains("change-in-production")
            || lowered.contains("local-dev-only")
            || lowered.contains("example")
            || lowered.starts_with("replace-me"))
    {
        return Err(ConfigError(
            "JWT_SECRET looks like a development placeholder; set a unique production secret"
                .into(),
        ));
    }

    Ok(())
}

impl Config {
    pub fn from_env() -> Result<Self, ConfigError> {
        let server_host = env::var("SERVER_HOST")?;
        let server_port = env::var("SERVER_PORT")
            .unwrap_or_else(|_| "8001".to_string())
            .parse()
            .map_err(|_| ConfigError("SERVER_PORT must be a valid u16".into()))?;

        let jwt_secret = env::var("JWT_SECRET")?;
        validate_jwt_secret(&jwt_secret)?;

        let jwt_access_expires_in_secs = env::var("JWT_ACCESS_EXPIRES_IN_SECS")
            .unwrap_or_else(|_| "900".to_string())
            .parse()
            .map_err(|_| ConfigError("JWT_ACCESS_EXPIRES_IN_SECS must be a valid u64".into()))?;

        let jwt_refresh_expires_in_secs = env::var("JWT_REFRESH_EXPIRES_IN_SECS")
            .unwrap_or_else(|_| "604800".to_string())
            .parse()
            .map_err(|_| ConfigError("JWT_REFRESH_EXPIRES_IN_SECS must be a valid u64".into()))?;

        let password_reset_expires_in_secs = env::var("PASSWORD_RESET_EXPIRES_IN_SECS")
            .unwrap_or_else(|_| "3600".to_string())
            .parse()
            .map_err(|_| {
                ConfigError("PASSWORD_RESET_EXPIRES_IN_SECS must be a valid u64".into())
            })?;

        let session_cleanup_interval_secs = env::var("SESSION_CLEANUP_INTERVAL_SECS")
            .unwrap_or_else(|_| "3600".to_string())
            .parse()
            .map_err(|_| {
                ConfigError("SESSION_CLEANUP_INTERVAL_SECS must be a valid u64".into())
            })?;

        let cors_allowed_origin = env::var("CORS_ALLOWED_ORIGIN")
            .unwrap_or_else(|_| "http://localhost:3000".to_string());
        let frontend_origin = env::var("FRONTEND_ORIGIN")
            .unwrap_or_else(|_| cors_allowed_origin.clone());

        let smtp_port = env::var("SMTP_PORT")
            .ok()
            .filter(|value| !value.is_empty())
            .unwrap_or_else(|| "587".to_string())
            .parse()
            .map_err(|_| ConfigError("SMTP_PORT must be a valid u16".into()))?;

        let smtp_tls = optional_env("SMTP_TLS")
            .unwrap_or_else(|| {
                if smtp_port == 465 {
                    "tls".into()
                } else {
                    "starttls".into()
                }
            })
            .to_ascii_lowercase();
        if !matches!(smtp_tls.as_str(), "starttls" | "tls" | "none") {
            return Err(ConfigError(
                "SMTP_TLS must be starttls, tls, or none".into(),
            ));
        }

        let smtp = SmtpSettings {
            host: optional_env("SMTP_HOST"),
            port: smtp_port,
            tls: smtp_tls,
            username: optional_env("SMTP_USERNAME"),
            password: optional_env("SMTP_PASSWORD"),
            from: optional_env("SMTP_FROM"),
            required: is_production(),
        };

        Ok(Self {
            server_host,
            server_port,
            database_url: env::var("DATABASE_URL")?,
            jwt_secret,
            jwt_issuer: env::var("JWT_ISSUER")
                .unwrap_or_else(|_| "constructor-wm-auth".to_string()),
            jwt_audience: env::var("JWT_AUDIENCE")
                .unwrap_or_else(|_| "constructor-wm-web".to_string()),
            jwt_access_expires_in_secs,
            jwt_refresh_expires_in_secs,
            cors_allowed_origin,
            frontend_origin,
            password_reset_expires_in_secs,
            session_cleanup_interval_secs,
            is_production: is_production(),
            trust_proxy: crate::rate_limit::trust_proxy_enabled(),
            smtp,
        })
    }
}
