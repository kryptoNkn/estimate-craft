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
    Conflict(String), // 409
    Internal, // 50
}

impl AppError {
    fn status_and_message(&self) -> (StatusCode, &str) {
        match self {
            Self::Validation(msg) => (StatusCode::BAD_REQUEST, msg.as_str()),
            Self::Conflict(msg) => (StatusCode::CONFLICT, msg.as_str()),
            Self::Internal => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "internal server error",
            ),
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
        }

        tracing::error!(%err, "database error");
        Self::Internal
    }
}

impl From<validator::ValidationErrors> for AppError {
    fn from(err: validator::ValidationErrors) -> Self {
        let message = err
            .field_errors()
            .values()
            .next()
            .and_then(|errors| errors.first())
            .map(|e| e.code.as_ref())
            .unwrap_or("validation failed")
            .to_string();

        Self::Validation(message)
    }
}