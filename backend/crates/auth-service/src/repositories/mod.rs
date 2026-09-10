//! Папка `repositories` — единственное место с SQL.
//! Роуты не пишут запросы сами: вызывают репозиторий.
//! `user` — таблица users, `session` — refresh и denylist access-токенов.

pub mod user;
pub mod session;