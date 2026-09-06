use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub server_host: String,
    pub server_port: u16,
    pub database_url: String,
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

        Ok(Self {
            server_host,
            server_port,
            database_url,
        })
    }
}