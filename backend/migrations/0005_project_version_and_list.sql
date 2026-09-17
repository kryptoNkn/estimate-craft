-- Версия для optimistic lock; индекс (updated_at, id) для курсорной пагинации.

ALTER TABLE projects
    ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE projects
    ADD CONSTRAINT projects_version_positive CHECK (version >= 1);

DROP INDEX IF EXISTS idx_projects_user_updated;

CREATE INDEX idx_projects_user_updated_id
    ON projects (user_id, updated_at DESC, id DESC);
