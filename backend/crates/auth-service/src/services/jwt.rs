//! Access JWT: подпись HS256, поля `iss`/`aud`/`jti`/`ver`, без `role`.
//! Refresh — не JWT, а случайная строка; хеш считается здесь же (`hash_refresh_token`).

use chrono::{Duration, Utc};
use jsonwebtoken::{
    decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{error::AppError, models::user::User};

pub struct JwtKeys<'a> {
    pub secret: &'a str,
    pub issuer: &'a str,
    pub audience: &'a str,
    pub access_expires_in_secs: u64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AccessClaims {
    pub sub: String,
    pub jti: String,
    pub iss: String,
    pub aud: String,
    pub exp: usize,
    pub iat: usize,
    pub ver: i32,
    pub typ: String,
}

pub fn create_access_token(user: &User, keys: &JwtKeys<'_>) -> Result<String, AppError> {
    let now = Utc::now();
    let exp = (now + Duration::seconds(keys.access_expires_in_secs as i64)).timestamp() as usize;

    let claims = AccessClaims {
        sub: user.id.to_string(),
        jti: Uuid::new_v4().to_string(),
        iss: keys.issuer.to_string(),
        aud: keys.audience.to_string(),
        exp,
        iat: now.timestamp() as usize,
        ver: user.token_version,
        typ: "access".to_string(),
    };

    encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(keys.secret.as_bytes()),
    )
    .map_err(|err| {
        tracing::error!(%err, "failed to create jwt");
        AppError::Internal
    })
}

pub fn verify_access_token(token: &str, keys: &JwtKeys<'_>) -> Result<AccessClaims, AppError> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.set_issuer(&[keys.issuer]);
    validation.set_audience(&[keys.audience]);
    validation.validate_exp = true;

    let claims = decode::<AccessClaims>(
        token,
        &DecodingKey::from_secret(keys.secret.as_bytes()),
        &validation,
    )
    .map(|data| data.claims)
    .map_err(|_| AppError::Unauthorized("invalid or expired token".into()))?;

    if claims.typ != "access" {
        return Err(AppError::Unauthorized("invalid token".into()));
    }

    Ok(claims)
}

pub fn new_refresh_token() -> String {
    format!("{}{}", Uuid::new_v4().simple(), Uuid::new_v4().simple())
}

pub fn hash_refresh_token(raw: &str) -> String {
    use sha2::{Digest, Sha256};

    Sha256::digest(raw.as_bytes())
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect()
}