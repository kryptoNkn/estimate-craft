//! Библиотека auth-service: роутер, конфиг, репозитории.
//! Бинарник в `main.rs` только поднимает сервер.

pub mod app;
pub mod cleanup;
pub mod config;
pub mod db;
pub mod error;
pub mod extractors;
pub mod models;
pub mod rate_limit;
pub mod repositories;
pub mod routes;
pub mod services;
pub mod state;
