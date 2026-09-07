use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

use crate::{
    error::AppError,
    models::user::User,
};

#[derive(Serialize, Deserialize, Debug)]
pub struct Claims {
    pub sub: String,
    pub email: String,
    pub role: String,
    pub exp: usize,
    pub iat: usize,
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

pub fn verify_token(token: &str, secret: &str) -> Result<Claims, AppError> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map(|data| data.claims)
    .map_err(|err| {
        tracing::warn!(%err, "invalid jwt");
        AppError::Unauthorized("invalid or expired token".into())

    })
}