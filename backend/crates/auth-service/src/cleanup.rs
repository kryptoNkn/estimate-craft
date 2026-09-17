//! Фоновая чистка просроченных refresh, denylist и токенов сброса пароля.
//! Без неё таблицы только растут: отозванные refresh и истёкшие jti никому не нужны.

use std::time::Duration;

use sqlx::PgPool;
use tracing::{error, info};

use crate::repositories::session::SessionRepository;

pub fn spawn(db: PgPool, interval_secs: u64) {
    let interval = Duration::from_secs(interval_secs.max(60));

    tokio::spawn(async move {
        let mut ticker = tokio::time::interval(interval);
        loop {
            ticker.tick().await;
            match SessionRepository::purge_expired(&db).await {
                Ok(purged) if purged.total() > 0 => {
                    info!(
                        refresh = purged.refresh,
                        denylist = purged.denylist,
                        password_reset = purged.password_reset,
                        "purged expired auth rows"
                    );
                }
                Ok(_) => {}
                Err(_) => error!("failed to purge expired auth rows"),
            }
        }
    });
}
