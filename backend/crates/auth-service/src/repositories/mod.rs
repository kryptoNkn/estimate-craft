//! Папка `repositories` — единственное место с SQL.
//! Роуты не пишут запросы сами: вызывают репозиторий.
//! `user` — таблица users, `session` — refresh и denylist, `password_reset` — сброс пароля.

pub mod user;
pub mod session;
pub mod password_reset;
pub mod project;