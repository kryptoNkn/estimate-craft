//! Проект 3D-конструктора: метаданные + JSON конфигурации дома.

use chrono::{DateTime, Utc};
use serde::Serialize;
use serde_json::Value;
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct Project {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub config: sqlx::types::Json<Value>,
    pub version: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize, Debug)]
pub struct ProjectResponse {
    pub id: Uuid,
    pub title: String,
    pub config: Value,
    pub version: i32,
    pub floors: Option<i32>,
    pub texture_type: Option<String>,
    pub architectural_style: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct ProjectSummaryRow {
    pub id: Uuid,
    pub title: String,
    pub version: i32,
    pub floors: Option<i32>,
    pub texture_type: Option<String>,
    pub architectural_style: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize, Debug)]
pub struct ProjectSummary {
    pub id: Uuid,
    pub title: String,
    pub version: i32,
    pub floors: Option<i32>,
    pub texture_type: Option<String>,
    pub architectural_style: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize, Debug)]
pub struct ProjectListResponse {
    pub items: Vec<ProjectSummary>,
    pub next_cursor: Option<String>,
    pub total: i64,
}

impl Project {
    pub fn into_response(self) -> ProjectResponse {
        let config = self.config.0;
        ProjectResponse {
            floors: config.get("floors").and_then(Value::as_i64).map(|n| n as i32),
            texture_type: config
                .get("textureType")
                .and_then(Value::as_str)
                .map(ToOwned::to_owned),
            architectural_style: config
                .get("architecturalStyle")
                .and_then(Value::as_str)
                .map(ToOwned::to_owned),
            id: self.id,
            title: self.title,
            config,
            version: self.version,
            created_at: self.created_at,
            updated_at: self.updated_at,
        }
    }
}

impl From<ProjectSummaryRow> for ProjectSummary {
    fn from(row: ProjectSummaryRow) -> Self {
        Self {
            id: row.id,
            title: row.title,
            version: row.version,
            floors: row.floors,
            texture_type: row.texture_type,
            architectural_style: row.architectural_style,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}
