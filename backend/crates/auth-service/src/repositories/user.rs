//! Запросы к таблице `users`: создать, найти по email/id, поднять `token_version`.
//! `token_version` сбрасывает все access JWT при logout-all.

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
            RETURNING id, email, password_hash, role, token_version, created_at, updated_at
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
            SELECT id, email, password_hash, role, token_version, created_at, updated_at
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
            SELECT id, email, password_hash, role, token_version, created_at, updated_at
            FROM users
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(user)
    }

    pub async fn bump_token_version(
        pool: &PgPool,
        user_id: Uuid,
    ) -> Result<(), AppError> {
        sqlx::query(
            r#"
            UPDATE users
            SET token_version = token_version + 1
            WHERE id = $1
            "#
        )
        .bind(user_id)
        .execute(pool)
        .await?;
        Ok(())
    }
}