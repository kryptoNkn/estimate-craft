//! SQL таблицы `projects`. Все выборки фильтруют `user_id` — чужие проекты не отдаём.

use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    error::AppError,
    models::project::{Project, ProjectSummaryRow},
};

pub struct ProjectListPage {
    pub items: Vec<ProjectSummaryRow>,
    pub next_cursor: Option<String>,
    pub total: i64,
}

pub struct ProjectRepository;

impl ProjectRepository {
    pub async fn list_page(
        pool: &PgPool,
        user_id: Uuid,
        search: Option<&str>,
        cursor: Option<(DateTime<Utc>, Uuid)>,
        limit: i64,
    ) -> Result<ProjectListPage, AppError> {
        let pattern = search.map(ilike_contains);
        let fetch_limit = limit + 1;
        let (cursor_updated_at, cursor_id) = match cursor {
            Some((updated_at, id)) => (Some(updated_at), Some(id)),
            None => (None, None),
        };

        let mut rows = sqlx::query_as::<_, ProjectSummaryRow>(
            r#"
            SELECT
                id,
                title,
                version,
                NULLIF(config->>'floors', '')::int AS floors,
                config->>'textureType' AS texture_type,
                config->>'architecturalStyle' AS architectural_style,
                created_at,
                updated_at
            FROM projects
            WHERE user_id = $1
              AND ($2::text IS NULL OR title ILIKE $2 ESCAPE '\')
              AND (
                    $3::timestamptz IS NULL
                    OR (updated_at, id) < ($3, $4)
                  )
            ORDER BY updated_at DESC, id DESC
            LIMIT $5
            "#,
        )
        .bind(user_id)
        .bind(pattern.as_deref())
        .bind(cursor_updated_at)
        .bind(cursor_id)
        .bind(fetch_limit)
        .fetch_all(pool)
        .await?;

        let next_cursor = if rows.len() as i64 > limit {
            rows.pop();
            rows.last().map(|row| encode_cursor(row.updated_at, row.id))
        } else {
            None
        };

        let total = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)::bigint
            FROM projects
            WHERE user_id = $1
              AND ($2::text IS NULL OR title ILIKE $2 ESCAPE '\')
            "#,
        )
        .bind(user_id)
        .bind(pattern.as_deref())
        .fetch_one(pool)
        .await?;

        Ok(ProjectListPage {
            items: rows,
            next_cursor,
            total,
        })
    }

    pub async fn count_for_user(pool: &PgPool, user_id: Uuid) -> Result<i64, AppError> {
        let count = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)::bigint
            FROM projects
            WHERE user_id = $1
            "#,
        )
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        Ok(count)
    }

    pub async fn create(
        pool: &PgPool,
        user_id: Uuid,
        title: &str,
        config: &Value,
    ) -> Result<Project, AppError> {
        let project = sqlx::query_as::<_, Project>(
            r#"
            INSERT INTO projects (user_id, title, config)
            VALUES ($1, $2, $3)
            RETURNING id, user_id, title, config, version, created_at, updated_at
            "#,
        )
        .bind(user_id)
        .bind(title)
        .bind(sqlx::types::Json(config))
        .fetch_one(pool)
        .await?;

        Ok(project)
    }

    pub async fn find_owned(
        pool: &PgPool,
        id: Uuid,
        user_id: Uuid,
    ) -> Result<Option<Project>, AppError> {
        let project = sqlx::query_as::<_, Project>(
            r#"
            SELECT id, user_id, title, config, version, created_at, updated_at
            FROM projects
            WHERE id = $1 AND user_id = $2
            "#,
        )
        .bind(id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        Ok(project)
    }

    pub async fn update_owned(
        pool: &PgPool,
        id: Uuid,
        user_id: Uuid,
        title: &str,
        config: &Value,
        version: i32,
    ) -> Result<Option<Project>, AppError> {
        let project = sqlx::query_as::<_, Project>(
            r#"
            UPDATE projects
            SET title = $3,
                config = $4,
                version = version + 1
            WHERE id = $1 AND user_id = $2 AND version = $5
            RETURNING id, user_id, title, config, version, created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(user_id)
        .bind(title)
        .bind(sqlx::types::Json(config))
        .bind(version)
        .fetch_optional(pool)
        .await?;

        Ok(project)
    }

    pub async fn delete_owned(
        pool: &PgPool,
        id: Uuid,
        user_id: Uuid,
    ) -> Result<bool, AppError> {
        let result = sqlx::query(
            r#"
            DELETE FROM projects
            WHERE id = $1 AND user_id = $2
            "#,
        )
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }
}

pub fn encode_cursor(updated_at: DateTime<Utc>, id: Uuid) -> String {
    format!("{}:{}", updated_at.timestamp_micros(), id)
}

pub fn decode_cursor(raw: &str) -> Result<(DateTime<Utc>, Uuid), AppError> {
    let (micros, id) = raw.split_once(':').ok_or_else(invalid_cursor)?;
    let micros = micros.parse::<i64>().map_err(|_| invalid_cursor())?;
    let id = Uuid::parse_str(id).map_err(|_| invalid_cursor())?;
    let updated_at = DateTime::<Utc>::from_timestamp_micros(micros).ok_or_else(invalid_cursor)?;
    Ok((updated_at, id))
}

fn invalid_cursor() -> AppError {
    AppError::Validation("invalid cursor".into())
}

fn ilike_contains(raw: &str) -> String {
    let mut escaped = String::with_capacity(raw.len());
    for ch in raw.chars() {
        if matches!(ch, '\\' | '%' | '_') {
            escaped.push('\\');
        }
        escaped.push(ch);
    }
    format!("%{escaped}%")
}
