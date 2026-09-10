//! Пароли: проверка политики, хеш Argon2id, сверка при логине.
//! MVP — от 8 символов; в production — от 12 и denylist простых паролей.
//! Сюда не логировать сам пароль, только результат проверки.

use argon2::{
    Argon2,
    password_hash::{
        PasswordHash, PasswordHasher, PasswordVerifier, SaltString, rand_core::OsRng,
    },
};

use validator::ValidationError;

use crate::error::AppError;

const MIN_LEN_MVP: usize = 8;
const MIN_LEN_PROD: usize = 12;

const COMMON_PASSWORDS: &[&str] = &[
    "password",
    "password1",
    "password123",
    "12345678",
    "123456789",
    "1234567890",
    "qwerty123",
    "qwertyui",
    "11111111",
    "00000000",
    "iloveyou",
    "admin123",
    "letmein1",
    "welcome1",
    "monkey12",
    "abc12345",
];

fn is_production() -> bool {
    std::env::var("APP_ENV")
        .or_else(|_| std::env::var("RUST_ENV"))
        .map(|value| {
            value.eq_ignore_ascii_case("production") || value.eq_ignore_ascii_case("prod")
        })
        .unwrap_or(false)
}

pub fn validate_password(password: &str) -> Result<(), ValidationError> {
    let min_len = if is_production() {
        MIN_LEN_PROD
    } else {
        MIN_LEN_MVP
    };
    if password.chars().count() < min_len {
        let mut error = ValidationError::new("password_too_short");
        error.message = Some(format!("Password must be at least {min_len} characters").into());
        return Err(error);
    }
    if is_production() {
        let lowered = password.to_ascii_lowercase();
        if COMMON_PASSWORDS.iter().any(|item| *item == lowered) {
            let mut error = ValidationError::new("password_too_common");
            error.message = Some("Password is too common".into());
            return Err(error);
        }
    }
    Ok(())
}

// хеширование пароля
pub fn hash_password(password: &str) -> Result<String, AppError> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    let hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|_| AppError::Internal)?
        .to_string();

    Ok(hash)
}

// сравнение пароля и хеша пароля
pub fn verify_password(password: &str, password_hash: &str) -> Result<bool, AppError> {
    let parsed_hash = PasswordHash::new(password_hash)
        .map_err(|_| AppError::Internal)?;

    Ok(Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok())
}