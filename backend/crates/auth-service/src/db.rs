//! Создание пула соединений Postgres (sqlx).
//! URL сюда передают, но не печатают: в нём логин и пароль БД.

use sqlx::{
    postgres::{PgPool, PgPoolOptions}
};

pub async fn create_pool(database_url: &str) -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(10)
        .min_connections(2)
        .connect(database_url)
        .await
}