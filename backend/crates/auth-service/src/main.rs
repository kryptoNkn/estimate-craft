//! Точка входа auth-сервиса.
//! Читает env, поднимает логи, пул Postgres, миграции и HTTP-сервер.
//! Остальная логика разнесена по модулям ниже — сюда её не тащить.

use std::net::SocketAddr;

use tokio::net::TcpListener;
use tracing::info;
use tracing_subscriber::EnvFilter;

use auth_service::{
    app, cleanup,
    config::Config,
    db::create_pool,
    services::password,
    state::AppState,
};

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
    password::warmup_dummy_hash();

    let db = create_pool(&config.database_url)
        .await
        .map_err(|_| "failed to connect to database")?;

    sqlx::migrate!("../../migrations")
        .run(&db)
        .await?;
    info!("migrations applied successfully");

    let address = SocketAddr::new(
        config.server_host.parse()?,
        config.server_port,
    );

    cleanup::spawn(db.clone(), config.session_cleanup_interval_secs);

    let mailer = auth_service::services::mail::Mailer::from_settings(&config.smtp)
        .map_err(|err| std::io::Error::other(err))?;
    if config.smtp.host.is_none() {
        info!("SMTP_HOST is empty: password reset links go to the auth-service log");
    }

    let state = AppState {
        db,
        jwt_secret: config.jwt_secret,
        jwt_issuer: config.jwt_issuer,
        jwt_audience: config.jwt_audience,
        jwt_access_expires_in_secs: config.jwt_access_expires_in_secs,
        jwt_refresh_expires_in_secs: config.jwt_refresh_expires_in_secs,
        cors_allowed_origin: config.cors_allowed_origin,
        frontend_origin: config.frontend_origin,
        password_reset_expires_in_secs: config.password_reset_expires_in_secs,
        mailer,
    };

    let listener = TcpListener::bind(address).await?;
    let app = app::create_app(state);
    info!(
        trust_proxy = config.trust_proxy,
        "auth-service listening on {}",
        address
    );

    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .with_graceful_shutdown(shutdown_signal())
    .await?;

    info!("auth-service stopped");
    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("failed to install SIGTERM handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }

    info!("shutdown signal received");
}
