//! Rate limit для login / register / refresh / смены и сброса пароля.
//! Ключ — IP клиента: 5 запросов пачкой, затем не чаще 1 в секунду.
//! По умолчанию берём peer IP. `TRUST_PROXY=true` — последний адрес из
//! `X-Forwarded-For` (nginx дописывает `$remote_addr`). Без этого флага
//! заголовок игнорируем, иначе клиент подставит чужой IP.
//! /me и logout не ограничиваем — там уже нужен валидный JWT.

use std::{
    net::{IpAddr, SocketAddr},
    sync::{Arc, LazyLock},
};

use axum::{
    Json,
    body::Body,
    extract::ConnectInfo,
    http::{HeaderMap, Request, StatusCode, header},
    response::{IntoResponse, Response},
};
use governor::middleware::NoOpMiddleware;
use serde_json::json;
use tower_governor::{
    GovernorLayer,
    errors::GovernorError,
    governor::{GovernorConfig, GovernorConfigBuilder},
    key_extractor::KeyExtractor,
};

#[derive(Clone, Copy, Debug)]
pub struct ClientIpKeyExtractor;

type AuthLimiter = GovernorConfig<ClientIpKeyExtractor, NoOpMiddleware>;

static AUTH_LIMITER: LazyLock<Arc<AuthLimiter>> = LazyLock::new(|| {
    let config = GovernorConfigBuilder::default()
        .per_second(1)
        .burst_size(5)
        .key_extractor(ClientIpKeyExtractor)
        .finish()
        .expect("auth rate limit config");

    Arc::new(config)
});

pub fn trust_proxy_enabled() -> bool {
    std::env::var("TRUST_PROXY")
        .map(|value| {
            value == "1"
                || value.eq_ignore_ascii_case("true")
                || value.eq_ignore_ascii_case("yes")
        })
        .unwrap_or(false)
}

/// Берём **последний** IP в XFF: при одном доверенном прокси это реальный клиент,
/// а не значение, которое злоумышленник положил первым.
pub fn forwarded_client_ip(headers: &HeaderMap) -> Option<IpAddr> {
    if let Some(value) = headers.get("x-forwarded-for").and_then(|v| v.to_str().ok()) {
        for part in value.split(',').rev() {
            if let Some(ip) = parse_ip_token(part) {
                return Some(ip);
            }
        }
    }

    headers
        .get("x-real-ip")
        .and_then(|v| v.to_str().ok())
        .and_then(parse_ip_token)
}

fn parse_ip_token(token: &str) -> Option<IpAddr> {
    let trimmed = token.trim().trim_matches('"');
    if let Ok(ip) = trimmed.parse::<IpAddr>() {
        return Some(ip);
    }
    trimmed.parse::<SocketAddr>().ok().map(|addr| addr.ip())
}

pub fn client_ip_from_request<T>(req: &Request<T>, trust_proxy: bool) -> Option<IpAddr> {
    if trust_proxy {
        if let Some(ip) = forwarded_client_ip(req.headers()) {
            return Some(ip);
        }
    }

    req.extensions()
        .get::<ConnectInfo<SocketAddr>>()
        .map(|ConnectInfo(addr)| addr.ip())
}

impl KeyExtractor for ClientIpKeyExtractor {
    type Key = IpAddr;

    fn extract<T>(&self, req: &Request<T>) -> Result<Self::Key, GovernorError> {
        client_ip_from_request(req, trust_proxy_enabled())
            .ok_or(GovernorError::UnableToExtractKey)
    }
}

fn rate_limit_response(err: GovernorError) -> Response {
    match err {
        GovernorError::TooManyRequests { wait_time, headers } => {
            let mut response = (
                StatusCode::TOO_MANY_REQUESTS,
                Json(json!({ "error": "too many requests" })),
            )
                .into_response();

            if let Ok(value) = header::HeaderValue::from_str(&wait_time.to_string()) {
                response.headers_mut().insert(header::RETRY_AFTER, value);
            }

            if let Some(extra) = headers {
                response.headers_mut().extend(extra);
            }

            response
        }
        GovernorError::UnableToExtractKey => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": "internal server error" })),
        )
            .into_response(),
        GovernorError::Other {
            code,
            msg,
            headers,
        } => {
            let message = msg.unwrap_or_else(|| "rate limit error".into());
            let mut response = (code, Json(json!({ "error": message }))).into_response();
            if let Some(extra) = headers {
                response.headers_mut().extend(extra);
            }
            response
        }
    }
}

pub fn auth_sensitive_layer() -> GovernorLayer<ClientIpKeyExtractor, NoOpMiddleware, Body> {
    GovernorLayer::new(AUTH_LIMITER.clone()).error_handler(rate_limit_response)
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::Request;

    fn request_with(peer: &str, xff: Option<&str>) -> Request<()> {
        let mut builder = Request::builder().uri("/");
        if let Some(xff) = xff {
            builder = builder.header("x-forwarded-for", xff);
        }
        let mut req = builder.body(()).expect("request");
        req.extensions_mut()
            .insert(ConnectInfo(peer.parse::<SocketAddr>().expect("peer")));
        req
    }

    #[test]
    fn without_trust_proxy_ignores_spoofed_xff() {
        let req = request_with("10.0.0.8:443", Some("8.8.8.8, 203.0.113.10"));
        let ip = client_ip_from_request(&req, false).expect("ip");
        assert_eq!(ip, "10.0.0.8".parse::<IpAddr>().unwrap());
    }

    #[test]
    fn with_trust_proxy_uses_last_xff_ip() {
        let req = request_with("10.0.0.8:443", Some("8.8.8.8, 203.0.113.10"));
        let ip = client_ip_from_request(&req, true).expect("ip");
        assert_eq!(ip, "203.0.113.10".parse::<IpAddr>().unwrap());
    }

    #[test]
    fn with_trust_proxy_falls_back_to_peer() {
        let req = request_with("192.0.2.4:80", None);
        let ip = client_ip_from_request(&req, true).expect("ip");
        assert_eq!(ip, "192.0.2.4".parse::<IpAddr>().unwrap());
    }
}
