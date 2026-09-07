mod app;
mod config;
mod state;
mod error;
mod db;
mod models;
mod repositories;
mod services;
mod routes;
mod extractors;

use crate::{config::Config, state::AppState};

use std::{net::SocketAddr};
use tokio::net::TcpListener;
use tracing::info;
use tracing_subscriber::EnvFilter;
use db::create_pool;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    let config = Config::from_env()?;

    let db = create_pool(&config.database_url).await?;

    sqlx::migrate!("../../migrations")
        .run(&db)
        .await?;
    info!("migrations applied successfully");

    let address = SocketAddr::new(
        config.server_host.parse()?,
        config.server_port,
    );

    let state = AppState {
        db,
        jwt_secret: config.jwt_secret,
        jwt_expires_in_secs: config.jwt_expires_in_secs,
        cors_allowed_origin: config.cors_allowed_origin,
    };

    let listener = TcpListener::bind(address).await?;
    let app = app::create_app(state);
    info!("auth-service listening on {}", address);

    axum::serve(listener, app).await?;

    Ok(())
}