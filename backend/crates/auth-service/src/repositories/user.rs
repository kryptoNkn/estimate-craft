use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    error::AppError,
    models::user::User,
};

pub struct UserRepository;

impl UserRepository {
    pub async fn create_user(
        pool: &PgPool,
        email: &str,
        password_hash: &str,
    ) -> Result<User, AppError> {
        let user = sqlx::query_as::<_, User>(
            r#"
            INSERT INTO users (email, password_hash)
            VALUES ($1, $2)
            RETURNING id, email, password_hash, role, created_at, updated_at
            "#,
        )
        .bind(email)
        .bind(password_hash)
        .fetch_one(pool)
        .await?;
        Ok(user)
    }

    pub async fn find_by_email(
        pool: &PgPool,
        email: &str,
    ) -> Result<Option<User>, AppError> {
        let user = sqlx::query_as::<_, User>(
            r#"
            SELECT id, email, password_hash, role, created_at, updated_at
            FROM users
            WHERE email = $1
            "#
        )
        .bind(email)
        .fetch_optional(pool)
        .await?;
        Ok(user)
    }

    pub async fn find_by_id(
        pool: &PgPool,
        id: Uuid,
    ) -> Result<Option<User>, AppError> {
        let user = sqlx::query_as::<_, User>(
            r#"
            SELECT id, email, password_hash, role, created_at, updated_at
            FROM users
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(user)
    }
}