//! Папка `routes` — HTTP-ручки. Этот файл вешает `/auth` на подроутер.
//! Новые группы API (проекты, сметы) добавляй соседними модулями, не в `auth.rs`.

mod auth;

use axum::Router;
use crate::state::AppState;

pub fn create_routes() -> Router<AppState> {
    Router::new().nest("/auth", auth::routes())
}