//! Единый тип ошибок API и превращение их в HTTP-ответы.
//! Хендлеры возвращают `AppError`, клиент видит JSON `{ "error": "..." }`.
//! В лог — коды/факт ошибки, не пароли и не connection string.

use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde::Serialize;
use std::borrow::Cow;

#[derive(Serialize)]
struct ErrorBody {
    error: String,
}

#[derive(Debug)]
pub enum AppError {
    Validation(String), // 400
    Unauthorized(String), // 401
    NotFound(String), // 404
    Conflict(String), // 409
    Internal, // 500
}

impl AppError {
    fn status_and_message(&self) -> (StatusCode, &str) {
        match self {
            Self::Validation(msg) => (StatusCode::BAD_REQUEST, msg.as_str()),
            Self::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, msg.as_str()),
            Self::NotFound(msg) => (StatusCode::NOT_FOUND, msg.as_str()),
            Self::Conflict(msg) => (StatusCode::CONFLICT, msg.as_str()),
            Self::Internal => (StatusCode::INTERNAL_SERVER_ERROR, "internal server error"),
        }
    }
}

// AppError to HTTP Response
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = self.status_and_message();

        let body = Json(ErrorBody {
            error: message.to_string(),
        });

        (status, body).into_response()
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        if let sqlx::Error::Database(db_err) = &err {
            if db_err.code() == Some(Cow::Borrowed("23505")) {
                return Self::Conflict("email already registered".into());
            }
            tracing::error!(
                code = ?db_err.code().as_deref(),
                "database error"
            );
            return Self::Internal;
        }
        tracing::error!("database error");
        Self::Internal
    }
}

impl From<validator::ValidationErrors> for AppError {
    fn from(err: validator::ValidationErrors) -> Self {
        let message = err
            .field_errors()
            .values()
            .flat_map(|errors| errors.iter())
            .find_map(|e| e.message.as_ref().map(|m| m.to_string()))
            .unwrap_or_else(|| "validation failed".to_string());
        Self::Validation(message)
    }
}