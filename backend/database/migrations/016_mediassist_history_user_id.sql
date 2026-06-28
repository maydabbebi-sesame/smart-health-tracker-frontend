-- mediassist_history previously stored the frontend's signed "uid" token
-- (see backend/api/security.py's encode_id) in user_uid VARCHAR(255); every
-- other per-user table (vitals, medical_history...) stores the numeric
-- users.id instead, so this brings it in line and lets it join against
-- users(id) directly. mediassist_service now decodes the token back into
-- this id before every query (see mediassist_service/app.py's
-- _decode_user_id) -- the frontend is unchanged, it still sends the same
-- signed token.
--
-- The old user_uid values are signed tokens, not recoverable in plain SQL,
-- so existing rows are cleared rather than migrated in place: this table is
-- conversation history, not a system of record, and is safe to lose.
CREATE TABLE IF NOT EXISTS mediassist_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_uid VARCHAR(255) NOT NULL,
    session_id VARCHAR(120) NOT NULL,
    role ENUM('user', 'assistant') NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (user_uid, session_id)
);

TRUNCATE TABLE mediassist_history;

ALTER TABLE mediassist_history DROP INDEX idx_session;
ALTER TABLE mediassist_history DROP COLUMN user_uid;
ALTER TABLE mediassist_history ADD COLUMN user_id INT NOT NULL AFTER id;
ALTER TABLE mediassist_history ADD INDEX idx_session (user_id, session_id);
ALTER TABLE mediassist_history ADD CONSTRAINT fk_mediassist_history_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
