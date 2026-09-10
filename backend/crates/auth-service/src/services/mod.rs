//! Папка `services` — логика без HTTP и без SQL:
//! пароли (argon2, правила длины) и JWT (выпуск / проверка).

pub mod password;
pub mod jwt;