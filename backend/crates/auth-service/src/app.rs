//! Сборка Axum-приложения: CORS, лимит тела, health-checks, `/api/v1`, трейсинг.
//! Сюда кладём только «обвязку» сервера, не бизнес-логику логина.

use axum::{
    Router,
    extract::State,
    http::{HeaderValue, Method, StatusCode},
    routing::get,
};
use std::time::Duration;
use tower_http::{cors::CorsLayer, timeout::TimeoutLayer, trace::TraceLayer};
use crate::{routes, state::AppState};

/// Зависший клиент не держит воркер дольше этого.
const REQUEST_TIMEOUT: Duration = Duration::from_secs(15);

pub fn create_app(state: AppState) -> Router {
    build_app(state, true)
}

pub fn create_app_without_rate_limit(state: AppState) -> Router {
    build_app(state, false)
}

fn build_app(state: AppState, rate_limit: bool) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(
            state
                .cors_allowed_origin
                .parse::<HeaderValue>()
                .expect("CORS_ALLOWED_ORIGIN must be a valid URL"),
        )
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PATCH,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([
            axum::http::header::AUTHORIZATION,
            axum::http::header::CONTENT_TYPE,
        ]);

    Router::new()
        .route("/health", get(health))
        .route("/health/ready", get(readiness))
        .nest("/api/v1", routes::create_routes(rate_limit))
        .layer(TimeoutLayer::with_status_code(
            StatusCode::REQUEST_TIMEOUT,
            REQUEST_TIMEOUT,
        ))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}

async fn health() -> &'static str {
    "OK"
}

async fn readiness(State(state): State<AppState>) -> StatusCode {
    match sqlx::query("SELECT 1").execute(&state.db).await {
        Ok(_) => StatusCode::OK,
        Err(_) => StatusCode::SERVICE_UNAVAILABLE,
    }
}
