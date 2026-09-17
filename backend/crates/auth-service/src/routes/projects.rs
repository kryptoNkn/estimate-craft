//! CRUD 3D-проектов. Все ручки требуют JWT; выборка только по `auth.user_id`.

use axum::{
    Json,
    extract::{Path, Query, State},
    http::StatusCode,
    routing::get,
    Router,
};
use serde::Deserialize;
use serde_json::Value;
use uuid::Uuid;
use validator::Validate;

use crate::{
    error::AppError,
    extractors::auth::AuthUser,
    models::project::{ProjectListResponse, ProjectResponse, ProjectSummary},
    repositories::project::{decode_cursor, ProjectRepository},
    services::house_config::validate_house_config,
    state::AppState,
};

const MAX_PROJECTS_PER_USER: i64 = 50;
const DEFAULT_LIST_LIMIT: i64 = 20;
const MAX_LIST_LIMIT: i64 = 50;
const MAX_SEARCH_LEN: usize = 80;

#[derive(Deserialize, Validate)]
pub struct CreateProjectRequest {
    #[validate(length(min = 1, max = 80, message = "Title must be 1-80 characters"))]
    pub title: String,
    pub config: Value,
}

#[derive(Deserialize, Validate)]
pub struct UpdateProjectRequest {
    #[validate(length(min = 1, max = 80, message = "Title must be 1-80 characters"))]
    pub title: String,
    pub config: Value,
    pub version: i32,
}

#[derive(Deserialize)]
pub struct ListProjectsQuery {
    pub limit: Option<i64>,
    pub cursor: Option<String>,
    pub q: Option<String>,
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_projects).post(create_project))
        .route(
            "/{id}",
            get(get_project).patch(update_project).delete(delete_project),
        )
}

async fn list_projects(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(query): Query<ListProjectsQuery>,
) -> Result<Json<ProjectListResponse>, AppError> {
    let limit = query.limit.unwrap_or(DEFAULT_LIST_LIMIT);
    if !(1..=MAX_LIST_LIMIT).contains(&limit) {
        return Err(AppError::Validation(format!(
            "limit must be 1-{MAX_LIST_LIMIT}"
        )));
    }

    let search = match query.q.as_deref().map(str::trim).filter(|value| !value.is_empty()) {
        Some(value) if value.chars().count() > MAX_SEARCH_LEN => {
            return Err(AppError::Validation(format!(
                "q must be at most {MAX_SEARCH_LEN} characters"
            )));
        }
        Some(value) => Some(value),
        None => None,
    };

    let cursor = match query.cursor.as_deref().map(str::trim).filter(|value| !value.is_empty()) {
        Some(raw) => Some(decode_cursor(raw)?),
        None => None,
    };

    let page =
        ProjectRepository::list_page(&state.db, auth.user_id, search, cursor, limit).await?;

    Ok(Json(ProjectListResponse {
        items: page.items.into_iter().map(ProjectSummary::from).collect(),
        next_cursor: page.next_cursor,
        total: page.total,
    }))
}

async fn create_project(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(body): Json<CreateProjectRequest>,
) -> Result<(StatusCode, Json<ProjectResponse>), AppError> {
    body.validate()?;
    validate_house_config(&body.config)?;

    let count = ProjectRepository::count_for_user(&state.db, auth.user_id).await?;
    if count >= MAX_PROJECTS_PER_USER {
        return Err(AppError::Validation(
            "project limit reached (50)".into(),
        ));
    }

    let title = body.title.trim();
    let project =
        ProjectRepository::create(&state.db, auth.user_id, title, &body.config).await?;

    Ok((StatusCode::CREATED, Json(project.into_response())))
}

async fn get_project(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ProjectResponse>, AppError> {
    let project = ProjectRepository::find_owned(&state.db, id, auth.user_id)
        .await?
        .ok_or_else(|| AppError::NotFound("project not found".into()))?;

    Ok(Json(project.into_response()))
}

async fn update_project(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(body): Json<UpdateProjectRequest>,
) -> Result<Json<ProjectResponse>, AppError> {
    body.validate()?;
    if body.version < 1 {
        return Err(AppError::Validation("version must be at least 1".into()));
    }
    validate_house_config(&body.config)?;

    let title = body.title.trim();
    let project = ProjectRepository::update_owned(
        &state.db,
        id,
        auth.user_id,
        title,
        &body.config,
        body.version,
    )
    .await?;

    if let Some(project) = project {
        return Ok(Json(project.into_response()));
    }

    if ProjectRepository::find_owned(&state.db, id, auth.user_id)
        .await?
        .is_some()
    {
        return Err(AppError::Conflict(
            "project was updated elsewhere".into(),
        ));
    }

    Err(AppError::NotFound("project not found".into()))
}

async fn delete_project(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    let deleted = ProjectRepository::delete_owned(&state.db, id, auth.user_id).await?;
    if !deleted {
        return Err(AppError::NotFound("project not found".into()));
    }

    Ok(StatusCode::NO_CONTENT)
}
