//! Интеграционные тесты сессий: refresh, denylist, token_version, смена пароля.

use std::net::SocketAddr;
use std::sync::OnceLock;

use tokio::sync::Mutex;

use auth_service::{
    app::{create_app, create_app_without_rate_limit},
    state::AppState,
};
use axum::{
    body::{Body, to_bytes},
    extract::ConnectInfo,
    http::{Request, StatusCode, header},
};
use serde_json::{Value, json};
use sqlx::PgPool;
use tower::ServiceExt;
use uuid::Uuid;

static SCHEMA_INIT: OnceLock<Mutex<bool>> = OnceLock::new();

async fn test_pool() -> PgPool {
    dotenvy::dotenv().ok();
    let url = std::env::var("DATABASE_URL").expect("DATABASE_URL is required for tests");
    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(5)
        .connect(&url)
        .await
        .expect("connect to database");

    let lock = SCHEMA_INIT.get_or_init(|| Mutex::new(false));
    let mut done = lock.lock().await;
    if !*done {
        ensure_schema(&pool).await;
        *done = true;
    }

    pool
}

async fn ensure_schema(pool: &PgPool) {
    sqlx::query(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0",
    )
    .execute(pool)
    .await
    .expect("token_version column");

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at TIMESTAMPTZ NOT NULL,
            revoked_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await
    .expect("refresh_tokens");

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id)")
        .execute(pool)
        .await
        .ok();

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS access_token_denylist (
            jti UUID PRIMARY KEY,
            expires_at TIMESTAMPTZ NOT NULL
        )
        "#,
    )
    .execute(pool)
    .await
    .expect("denylist");

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at TIMESTAMPTZ NOT NULL,
            used_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await
    .expect("password_reset_tokens");

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            config JSONB NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await
    .expect("projects");

    sqlx::query(
        "ALTER TABLE projects ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1",
    )
    .execute(pool)
    .await
    .expect("projects.version");
}

fn test_state(db: PgPool) -> AppState {
    test_state_with_mailer(db, auth_service::services::mail::Mailer::log())
}

fn test_state_with_mailer(db: PgPool, mailer: auth_service::services::mail::Mailer) -> AppState {
    AppState {
        db,
        jwt_secret: "test-secret-constructor-wm-jwt-do-not-ship-xx".into(),
        jwt_issuer: "constructor-wm-auth".into(),
        jwt_audience: "constructor-wm-web".into(),
        jwt_access_expires_in_secs: 900,
        jwt_refresh_expires_in_secs: 604800,
        cors_allowed_origin: "http://localhost:3000".into(),
        frontend_origin: "http://localhost:3000".into(),
        password_reset_expires_in_secs: 3600,
        mailer,
    }
}

fn unique_email() -> String {
    format!("user-{}@example.com", Uuid::new_v4())
}

fn request(method: &str, path: &str, body: Option<Value>, token: Option<&str>) -> Request<Body> {
    let mut builder = Request::builder()
        .method(method)
        .uri(path)
        .header(header::CONTENT_TYPE, "application/json");

    if let Some(token) = token {
        builder = builder.header(header::AUTHORIZATION, format!("Bearer {token}"));
    }

    let mut req = builder
        .body(match body {
            Some(value) => Body::from(value.to_string()),
            None => Body::empty(),
        })
        .expect("request");

    req.extensions_mut()
        .insert(ConnectInfo(SocketAddr::from(([127, 0, 0, 1], 40000))));
    req
}

async fn send(
    app: &axum::Router,
    req: Request<Body>,
) -> (StatusCode, Value) {
    let response = app.clone().oneshot(req).await.expect("oneshot");
    let status = response.status();
    let bytes = to_bytes(response.into_body(), 1024 * 1024)
        .await
        .expect("body");

    let json = if bytes.is_empty() {
        Value::Null
    } else {
        serde_json::from_slice(&bytes).unwrap_or(Value::Null)
    };

    (status, json)
}

async fn register_and_login(app: &axum::Router, email: &str, password: &str) -> Value {
    let (status, body) = send(
        app,
        request(
            "POST",
            "/api/v1/auth/register",
            Some(json!({ "email": email, "password": password })),
            None,
        ),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED, "register failed: {body}");

    let (status, body) = send(
        app,
        request(
            "POST",
            "/api/v1/auth/login",
            Some(json!({ "email": email, "password": password })),
            None,
        ),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    body
}

fn token_pair(body: &Value) -> (&str, &str) {
    (
        body["access_token"].as_str().expect("access_token"),
        body["refresh_token"].as_str().expect("refresh_token"),
    )
}

#[tokio::test]
async fn refresh_rotates_and_rejects_old_token() {
    let app = create_app_without_rate_limit(test_state(test_pool().await));
    let email = unique_email();
    let tokens = register_and_login(&app, &email, "password12").await;
    let (access, refresh) = token_pair(&tokens);

    let (status, me) = send(
        &app,
        request("GET", "/api/v1/auth/me", None, Some(access)),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(me["email"], email);

    let (status, rotated) = send(
        &app,
        request(
            "POST",
            "/api/v1/auth/refresh",
            Some(json!({ "refresh_token": refresh })),
            None,
        ),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    let (new_access, new_refresh) = token_pair(&rotated);
    assert_ne!(new_access, access);
    assert_ne!(new_refresh, refresh);

    let (status, _) = send(
        &app,
        request(
            "POST",
            "/api/v1/auth/refresh",
            Some(json!({ "refresh_token": refresh })),
            None,
        ),
    )
    .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);

    let (status, _) = send(
        &app,
        request("GET", "/api/v1/auth/me", None, Some(new_access)),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
}

#[tokio::test]
async fn logout_denylists_access_token() {
    let app = create_app_without_rate_limit(test_state(test_pool().await));
    let tokens = register_and_login(&app, &unique_email(), "password12").await;
    let (access, refresh) = token_pair(&tokens);

    let (status, _) = send(
        &app,
        request(
            "POST",
            "/api/v1/auth/logout",
            Some(json!({ "refresh_token": refresh })),
            Some(access),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::NO_CONTENT);

    let (status, body) = send(
        &app,
        request("GET", "/api/v1/auth/me", None, Some(access)),
    )
    .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(body["error"], "token revoked");
}

#[tokio::test]
async fn change_password_bumps_token_version_and_revokes_refresh() {
    let app = create_app_without_rate_limit(test_state(test_pool().await));
    let email = unique_email();
    let tokens = register_and_login(&app, &email, "password12").await;
    let (old_access, old_refresh) = token_pair(&tokens);

    let (status, updated) = send(
        &app,
        request(
            "POST",
            "/api/v1/auth/change-password",
            Some(json!({
                "current_password": "password12",
                "new_password": "password34"
            })),
            Some(old_access),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    let (new_access, _) = token_pair(&updated);

    let (status, body) = send(
        &app,
        request("GET", "/api/v1/auth/me", None, Some(old_access)),
    )
    .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(body["error"], "token revoked");

    let (status, _) = send(
        &app,
        request(
            "POST",
            "/api/v1/auth/refresh",
            Some(json!({ "refresh_token": old_refresh })),
            None,
        ),
    )
    .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);

    let (status, me) = send(
        &app,
        request("GET", "/api/v1/auth/me", None, Some(new_access)),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(me["email"], email);

    let (status, _) = send(
        &app,
        request(
            "POST",
            "/api/v1/auth/login",
            Some(json!({ "email": email, "password": "password12" })),
            None,
        ),
    )
    .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn logout_all_invalidates_access_via_token_version() {
    let app = create_app_without_rate_limit(test_state(test_pool().await));
    let tokens = register_and_login(&app, &unique_email(), "password12").await;
    let (access, refresh) = token_pair(&tokens);

    let (status, _) = send(
        &app,
        request("POST", "/api/v1/auth/logout-all", None, Some(access)),
    )
    .await;
    assert_eq!(status, StatusCode::NO_CONTENT);

    let (status, body) = send(
        &app,
        request("GET", "/api/v1/auth/me", None, Some(access)),
    )
    .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(body["error"], "token revoked");

    let (status, _) = send(
        &app,
        request(
            "POST",
            "/api/v1/auth/refresh",
            Some(json!({ "refresh_token": refresh })),
            None,
        ),
    )
    .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn rate_limit_returns_json_429() {
    let app = create_app(test_state(test_pool().await));
    let payload = json!({ "email": "not-an-email", "password": "x" });

    let mut last_status = StatusCode::BAD_REQUEST;
    let mut last_body = Value::Null;
    let mut last_retry_after = None;

    for _ in 0..6 {
        let response = app
            .clone()
            .oneshot(request(
                "POST",
                "/api/v1/auth/login",
                Some(payload.clone()),
                None,
            ))
            .await
            .expect("oneshot");
        last_status = response.status();
        last_retry_after = response
            .headers()
            .get(header::RETRY_AFTER)
            .and_then(|v| v.to_str().ok())
            .map(str::to_string);
        let bytes = to_bytes(response.into_body(), 1024 * 1024)
            .await
            .expect("body");
        last_body = serde_json::from_slice(&bytes).unwrap_or(Value::Null);
    }

    assert_eq!(last_status, StatusCode::TOO_MANY_REQUESTS);
    assert_eq!(last_body["error"], "too many requests");
    assert!(last_retry_after.is_some());
}

fn sample_house_config() -> Value {
    json!({
        "floors": 2,
        "hasGarage": false,
        "garageCars": 1,
        "textureType": "stucco",
        "foundationType": "monolith",
        "floorColors": ["#ffffff"],
        "veranda": { "hasVeranda": false, "material": "wood_light", "fenceStyle": "none", "isBaseClosed": false, "width": 4, "length": 2 },
        "rooms": 3,
        "partitionMaterial": "drywall",
        "openings": []
    })
}

#[tokio::test]
async fn projects_crud_is_scoped_to_owner() {
    let app = create_app_without_rate_limit(test_state(test_pool().await));
    let owner = register_and_login(&app, &unique_email(), "password12").await;
    let other = register_and_login(&app, &unique_email(), "password12").await;
    let owner_access = owner["access_token"].as_str().unwrap();
    let other_access = other["access_token"].as_str().unwrap();

    let (status, created) = send(
        &app,
        request(
            "POST",
            "/api/v1/projects",
            Some(json!({
                "title": "Дом у леса",
                "config": sample_house_config()
            })),
            Some(owner_access),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED, "{created}");
    let id = created["id"].as_str().unwrap();
    assert_eq!(created["version"], 1);

    let (status, list) = send(
        &app,
        request("GET", "/api/v1/projects", None, Some(owner_access)),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(list["items"].as_array().unwrap().len(), 1);
    assert_eq!(list["total"], 1);
    assert!(list["next_cursor"].is_null());

    let (status, stranger_list) = send(
        &app,
        request("GET", "/api/v1/projects", None, Some(other_access)),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(stranger_list["items"].as_array().unwrap().len(), 0);
    assert_eq!(stranger_list["total"], 0);

    let (status, _) = send(
        &app,
        request(
            "GET",
            &format!("/api/v1/projects/{id}"),
            None,
            Some(other_access),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::NOT_FOUND);

    let (status, _) = send(
        &app,
        request(
            "PATCH",
            &format!("/api/v1/projects/{id}"),
            Some(json!({
                "title": "Взломанный",
                "config": sample_house_config(),
                "version": 1
            })),
            Some(other_access),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::NOT_FOUND);

    let (status, _) = send(
        &app,
        request(
            "DELETE",
            &format!("/api/v1/projects/{id}"),
            None,
            Some(other_access),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::NOT_FOUND);

    let (status, fetched) = send(
        &app,
        request(
            "GET",
            &format!("/api/v1/projects/{id}"),
            None,
            Some(owner_access),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(fetched["title"], "Дом у леса");

    let (status, _) = send(
        &app,
        request(
            "DELETE",
            &format!("/api/v1/projects/{id}"),
            None,
            Some(owner_access),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::NO_CONTENT);
}

#[tokio::test]
async fn projects_require_auth() {
    let app = create_app_without_rate_limit(test_state(test_pool().await));
    let (status, _) = send(
        &app,
        request("GET", "/api/v1/projects", None, None),
    )
    .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn project_config_must_match_house_schema() {
    let app = create_app_without_rate_limit(test_state(test_pool().await));
    let tokens = register_and_login(&app, &unique_email(), "password12").await;
    let access = tokens["access_token"].as_str().unwrap();

    let mut bad = sample_house_config();
    bad["floors"] = json!(99);

    let (status, body) = send(
        &app,
        request(
            "POST",
            "/api/v1/projects",
            Some(json!({
                "title": "Сломанный",
                "config": bad
            })),
            Some(access),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{body}");
    assert_eq!(body["error"], "floors must be 1-5");
}

#[tokio::test]
async fn forgot_password_sends_reset_link() {
    let (mailer, inbox) = auth_service::services::mail::Mailer::capturing();
    let app = create_app_without_rate_limit(test_state_with_mailer(test_pool().await, mailer));
    let email = unique_email();
    register_and_login(&app, &email, "password12").await;

    let (status, _) = send(
        &app,
        request(
            "POST",
            "/api/v1/auth/forgot-password",
            Some(json!({ "email": email })),
            None,
        ),
    )
    .await;
    assert_eq!(status, StatusCode::NO_CONTENT);

    let mail = inbox.last().expect("reset email");
    assert_eq!(mail.to, email);
    let token = mail
        .body
        .split("token=")
        .nth(1)
        .and_then(|rest| rest.split_whitespace().next())
        .expect("reset token in body");

    let (status, reset) = send(
        &app,
        request(
            "POST",
            "/api/v1/auth/reset-password",
            Some(json!({
                "token": token,
                "password": "password34"
            })),
            None,
        ),
    )
    .await;
    assert_eq!(status, StatusCode::OK, "{reset}");

    let (status, login) = send(
        &app,
        request(
            "POST",
            "/api/v1/auth/login",
            Some(json!({
                "email": email,
                "password": "password34"
            })),
            None,
        ),
    )
    .await;
    assert_eq!(status, StatusCode::OK, "{login}");
}

#[tokio::test]
async fn forgot_password_unknown_email_is_silent() {
    let (mailer, inbox) = auth_service::services::mail::Mailer::capturing();
    let app = create_app_without_rate_limit(test_state_with_mailer(test_pool().await, mailer));

    let (status, _) = send(
        &app,
        request(
            "POST",
            "/api/v1/auth/forgot-password",
            Some(json!({ "email": unique_email() })),
            None,
        ),
    )
    .await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    assert!(inbox.last().is_none());
}

#[tokio::test]
async fn project_update_rejects_stale_version() {
    let app = create_app_without_rate_limit(test_state(test_pool().await));
    let tokens = register_and_login(&app, &unique_email(), "password12").await;
    let access = tokens["access_token"].as_str().unwrap();

    let (status, created) = send(
        &app,
        request(
            "POST",
            "/api/v1/projects",
            Some(json!({
                "title": "Версия",
                "config": sample_house_config()
            })),
            Some(access),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED, "{created}");
    let id = created["id"].as_str().unwrap();

    let (status, saved) = send(
        &app,
        request(
            "PATCH",
            &format!("/api/v1/projects/{id}"),
            Some(json!({
                "title": "Версия 2",
                "config": sample_house_config(),
                "version": 1
            })),
            Some(access),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::OK, "{saved}");
    assert_eq!(saved["version"], 2);
    assert_eq!(saved["title"], "Версия 2");

    let (status, stale) = send(
        &app,
        request(
            "PATCH",
            &format!("/api/v1/projects/{id}"),
            Some(json!({
                "title": "Устарело",
                "config": sample_house_config(),
                "version": 1
            })),
            Some(access),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::CONFLICT, "{stale}");
    assert_eq!(stale["error"], "project was updated elsewhere");
}

#[tokio::test]
async fn project_list_paginates_and_filters_by_title() {
    let app = create_app_without_rate_limit(test_state(test_pool().await));
    let tokens = register_and_login(&app, &unique_email(), "password12").await;
    let access = tokens["access_token"].as_str().unwrap();

    for title in ["Альфа дом", "Бета дача", "Альфа сад"] {
        let (status, _) = send(
            &app,
            request(
                "POST",
                "/api/v1/projects",
                Some(json!({
                    "title": title,
                    "config": sample_house_config()
                })),
                Some(access),
            ),
        )
        .await;
        assert_eq!(status, StatusCode::CREATED);
    }

    let (status, first) = send(
        &app,
        request("GET", "/api/v1/projects?limit=1", None, Some(access)),
    )
    .await;
    assert_eq!(status, StatusCode::OK, "{first}");
    assert_eq!(first["items"].as_array().unwrap().len(), 1);
    assert_eq!(first["total"], 3);
    let cursor = first["next_cursor"].as_str().expect("next_cursor");

    let (status, second) = send(
        &app,
        request(
            "GET",
            &format!("/api/v1/projects?limit=1&cursor={cursor}"),
            None,
            Some(access),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::OK, "{second}");
    assert_eq!(second["items"].as_array().unwrap().len(), 1);
    assert_ne!(
        first["items"][0]["id"],
        second["items"][0]["id"]
    );

    let (status, search) = send(
        &app,
        request(
            "GET",
            "/api/v1/projects?q=%D0%90%D0%BB%D1%8C%D1%84%D0%B0",
            None,
            Some(access),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::OK, "{search}");
    assert_eq!(search["total"], 2);
    assert_eq!(search["items"].as_array().unwrap().len(), 2);
}
