//! Модель пользователя.
//! `User` — строка из БД, включая `password_hash` (наружу не отдаём).
//! `UserResponse` — то, что уходит клиенту: id, email, role, дата.

use serde::Serialize;
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub password_hash: String,
    pub role: String,
    pub token_version: i32,
    pub created_at: DateTime<Utc>,
    #[allow(dead_code)]
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize, Debug)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub role: String,
    pub created_at: DateTime<Utc>,
}

impl User {
    pub fn into_response(self) -> UserResponse {
        UserResponse {
            id: self.id,
            email: self.email,
            role: self.role,
            created_at: self.created_at,
        }
    }
}