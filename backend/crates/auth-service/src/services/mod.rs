//! Папка `services` — логика без HTTP и без SQL:
//! пароли (argon2, правила длины), JWT, почта и схема дома.

pub mod house_config;
pub mod jwt;
pub mod mail;
pub mod password;