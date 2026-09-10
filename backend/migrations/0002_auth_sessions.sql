-- Сессии JWT: token_version у пользователя, таблица refresh_tokens,
-- denylist access-токенов по jti. Нужен после 0001_create_users.

ALTER TABLE users
    ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0;

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);

CREATE TABLE access_token_denylist (
    jti UUID PRIMARY KEY,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_access_denylist_expires_at
    ON access_token_denylist (expires_at);