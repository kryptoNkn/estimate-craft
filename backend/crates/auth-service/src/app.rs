use axum::{Router, routing::get, extract::State, http::StatusCode};
use tower_http::trace::TraceLayer;
use crate::{routes, state::AppState};

pub fn create_app(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/health/ready", get(readiness))
        .nest("/api/v1", routes::create_routes())
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}

async fn health() -> &'static str {
    "OK"
}

// ответ бд на готовность
async fn readiness(State(state): State<AppState>) -> StatusCode {
    match sqlx::query("SELECT 1").execute(&state.db).await {
        Ok(_) => StatusCode::OK,
        Err(_) => StatusCode::SERVICE_UNAVAILABLE,
    }
}