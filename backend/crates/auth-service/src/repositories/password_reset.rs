//! Токены сброса пароля: храним только хеш, одноразовые, с TTL.

use chrono::{Duration, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;

#[derive(sqlx::FromRow)]
pub struct PasswordResetRow {
    pub id: Uuid,
    pub user_id: Uuid,
}

pub struct PasswordResetRepository;

impl PasswordResetRepository {
    pub async fn invalidate_unused(pool: &PgPool, user_id: Uuid) -> Result<(), AppError> {
        sqlx::query(
            r#"
            UPDATE password_reset_tokens
            SET used_at = NOW()
            WHERE user_id = $1
              AND used_at IS NULL
              AND expires_at > NOW()
            "#,
        )
        .bind(user_id)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn create(
        pool: &PgPool,
        user_id: Uuid,
        token_hash: &str,
        ttl_secs: u64,
    ) -> Result<(), AppError> {
        let expires_at = Utc::now() + Duration::seconds(ttl_secs as i64);

        sqlx::query(
            r#"
            INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
            VALUES ($1, $2, $3)
            "#,
        )
        .bind(user_id)
        .bind(token_hash)
        .bind(expires_at)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn find_active(
        pool: &PgPool,
        token_hash: &str,
    ) -> Result<Option<PasswordResetRow>, AppError> {
        let row = sqlx::query_as::<_, PasswordResetRow>(
            r#"
            SELECT id, user_id
            FROM password_reset_tokens
            WHERE token_hash = $1
              AND used_at IS NULL
              AND expires_at > NOW()
            "#,
        )
        .bind(token_hash)
        .fetch_optional(pool)
        .await?;

        Ok(row)
    }

    pub async fn mark_used(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
        sqlx::query(
            r#"
            UPDATE password_reset_tokens
            SET used_at = NOW()
            WHERE id = $1 AND used_at IS NULL
            "#,
        )
        .bind(id)
        .execute(pool)
        .await?;

        Ok(())
    }
}
