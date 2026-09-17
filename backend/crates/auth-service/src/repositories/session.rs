//! Сессии: refresh-токены (в БД хеш, не сырая строка) и denylist `jti` access JWT.
//! Logout отзывает refresh и банит текущий access до `exp`.

use chrono::{DateTime, Duration, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;

#[derive(sqlx::FromRow)]
pub struct RefreshTokenRow {
    pub id: Uuid,
    pub user_id: Uuid,
}

pub struct SessionRepository;

impl SessionRepository {
    pub async fn create_refresh(
        pool: &PgPool,
        user_id: Uuid,
        token_hash: &str,
        ttl_secs: u64,
    ) -> Result<(), AppError> {
        let expires_at = Utc::now() + Duration::seconds(ttl_secs as i64);

        sqlx::query(
            r#"
            INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
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

    pub async fn find_active_refresh(
        pool: &PgPool,
        token_hash: &str,
    ) -> Result<Option<RefreshTokenRow>, AppError> {
        let row = sqlx::query_as::<_, RefreshTokenRow>(
            r#"
            SELECT id, user_id
            FROM refresh_tokens
            WHERE token_hash = $1
              AND revoked_at IS NULL
              AND expires_at > NOW()
            "#,
        )
        .bind(token_hash)
        .fetch_optional(pool)
        .await?;

        Ok(row)
    }

    pub async fn revoke_refresh(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
        sqlx::query(
            r#"
            UPDATE refresh_tokens
            SET revoked_at = NOW()
            WHERE id = $1 AND revoked_at IS NULL
            "#,
        )
        .bind(id)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn revoke_all_refresh(pool: &PgPool, user_id: Uuid) -> Result<(), AppError> {
        sqlx::query(
            r#"
            UPDATE refresh_tokens
            SET revoked_at = NOW()
            WHERE user_id = $1 AND revoked_at IS NULL
            "#,
        )
        .bind(user_id)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn denylist_access(
        pool: &PgPool,
        jti: Uuid,
        exp: usize,
    ) -> Result<(), AppError> {
        let expires_at = DateTime::<Utc>::from_timestamp(exp as i64, 0)
            .ok_or(AppError::Unauthorized("invalid token".into()))?;

        sqlx::query(
            r#"
            INSERT INTO access_token_denylist (jti, expires_at)
            VALUES ($1, $2)
            ON CONFLICT (jti) DO NOTHING
            "#,
        )
        .bind(jti)
        .bind(expires_at)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn is_access_denied(pool: &PgPool, jti: Uuid) -> Result<bool, AppError> {
        let found: Option<Uuid> = sqlx::query_scalar(
            r#"
            SELECT jti
            FROM access_token_denylist
            WHERE jti = $1 AND expires_at > NOW()
            "#,
        )
        .bind(jti)
        .fetch_optional(pool)
        .await?;

        Ok(found.is_some())
    }

    pub async fn purge_expired(pool: &PgPool) -> Result<PurgeStats, AppError> {
        let refresh = sqlx::query(
            r#"
            DELETE FROM refresh_tokens
            WHERE expires_at < NOW()
               OR revoked_at IS NOT NULL
            "#,
        )
        .execute(pool)
        .await?
        .rows_affected();

        let denylist = sqlx::query(
            r#"
            DELETE FROM access_token_denylist
            WHERE expires_at < NOW()
            "#,
        )
        .execute(pool)
        .await?
        .rows_affected();

        let password_reset = sqlx::query(
            r#"
            DELETE FROM password_reset_tokens
            WHERE expires_at < NOW()
               OR used_at IS NOT NULL
            "#,
        )
        .execute(pool)
        .await?
        .rows_affected();

        Ok(PurgeStats {
            refresh,
            denylist,
            password_reset,
        })
    }
}

#[derive(Clone, Copy)]
pub struct PurgeStats {
    pub refresh: u64,
    pub denylist: u64,
    pub password_reset: u64,
}

impl PurgeStats {
    pub fn total(self) -> u64 {
        self.refresh + self.denylist + self.password_reset
    }
}