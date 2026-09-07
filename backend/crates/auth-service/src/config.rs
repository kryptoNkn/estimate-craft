use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub server_host: String,
    pub server_port: u16,
    pub database_url: String,
    pub jwt_secret: String,
    pub jwt_expires_in_secs: u64,
    pub cors_allowed_origin: String,
}

impl Config {
    pub fn from_env() -> Result<Self, env::VarError> {
        let server_host = 
            env::var("SERVER_HOST")?;

        let server_port = 
            env::var("SERVER_PORT")
                .unwrap_or_else(|_| "8001".to_string())
                .parse()
                .expect("SERVER_PORT must be a valid u16");

        let database_url = env::var("DATABASE_URL")?;

        let jwt_secret = env::var("JWT_SECRET")?;
        let jwt_expires_in_secs = env::var("JWT_EXPIRES_IN_SECS")
            .unwrap_or_else(|_| "3600".to_string())
            .parse()
            .expect("JWT_EXPIRES_IN_SECS must be a valid u64");

            let cors_allowed_origin = env::var("CORS_ALLOWED_ORIGIN")
            .unwrap_or_else(|_| "http://localhost:3000".to_string());

        Ok(Self {
            server_host,
            server_port,
            database_url,
            jwt_secret,
            jwt_expires_in_secs,
            cors_allowed_origin,
        })
    }
}