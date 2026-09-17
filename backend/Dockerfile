# Сборка образа auth-service: сначала cargo --release, потом тонкий debian с бинарём.
# Контекст сборки — папка backend (Cargo.toml, crates/, migrations/).

FROM rust:1.85-bookworm AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY crates ./crates
COPY migrations ./migrations
RUN cargo build --release -p auth-service
FROM debian:bookworm-slim AS runtime
RUN apt-get update \
    && apt-get install -y ca-certificates libssl3 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/auth-service /app/auth-service
EXPOSE 8001
CMD ["./auth-service"]