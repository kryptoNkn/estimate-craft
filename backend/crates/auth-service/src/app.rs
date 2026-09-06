use axum::{Router, routing::get, extract::State, http::StatusCode};
use tower_http::trace::TraceLayer;

use crate::state::AppState;

pub fn create_app(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/health/ready", get(readiness))
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}

async fn health() -> &'static str {
    "OK"
}

// ответ бд на готовность
async fn readiness(State(state): State<AppState>) -> Result<StatusCode> {
    match sqlx::query("SELECT 1").execute(&state.db).await {
        Ok(_) => StatusCode::OK.into(),
        Err(_) => StatusCode::SERVICE_UNAVAILABLE,
    }
}