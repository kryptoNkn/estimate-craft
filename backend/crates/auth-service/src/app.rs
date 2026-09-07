use axum::{
    Router,
    extract::State,
    http::{HeaderValue, Method, StatusCode},
    routing::get,
};
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use crate::{routes, state::AppState};

pub fn create_app(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(
            state
                .cors_allowed_origin
                .parse::<HeaderValue>()
                .expect("CORS_ALLOWED_ORIGIN must be a valid URL"),
        )
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([
            axum::http::header::AUTHORIZATION,
            axum::http::header::CONTENT_TYPE,
        ]);

    Router::new()
        .route("/health", get(health))
        .route("/health/ready", get(readiness))
        .nest("/api/v1", routes::create_routes())
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
