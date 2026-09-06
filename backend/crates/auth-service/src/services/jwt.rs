use chrono::{Duration, Utc};
use jsonwebtoken::{encode, EncodingKey, Header};
use serde::{Deserialize, Serialize};

use crate::{
    error::AppError,
    models::user::User,
};

#[derive(Serialize, Deserialize, Debug)]
struct Claims {
    sub: String,
    email: String,
    role: String,
    exp: usize,
    iat: usize,
}

pub fn create_token(
    user: &User,
    secret: &str,
    expires_in_secs: u64,
) -> Result<String, AppError> {
    let now = Utc::now();
    let exp = (now + Duration::seconds(expires_in_secs as i64)).timestamp() as usize;

    let claims = Claims {
        sub: user.id.to_string(),
        email: user.email.clone(),
        role: user.role.clone(),
        exp,
        iat: now.timestamp() as usize,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|err| {
        tracing::error!(%err, "failed to create jwt");
        AppError::Internal
    })
}
