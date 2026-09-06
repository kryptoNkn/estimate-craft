mod auth;

use axum::Router;
use crate::state::AppState;

pub fn create_routes() -> Router<AppState> {
    Router::new().nest("/auth", auth::routes())
}