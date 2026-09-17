//! Папка `routes` — HTTP-ручки. Этот файл вешает `/auth` на подроутер.
//! Новые группы API (проекты, сметы) добавляй соседними модулями, не в `auth.rs`.

mod auth;
mod projects;

use axum::{extract::DefaultBodyLimit, Router};
use crate::state::AppState;

pub fn create_routes(rate_limit: bool) -> Router<AppState> {
    Router::new()
        .nest(
            "/auth",
            auth::routes(rate_limit).layer(DefaultBodyLimit::max(16 * 1024)),
        )
        .nest(
            "/projects",
            projects::routes().layer(DefaultBodyLimit::max(256 * 1024)),
        )
}