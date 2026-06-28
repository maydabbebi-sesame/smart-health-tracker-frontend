-- MediAssist conversation history
-- Scoped by (user_id, session_id): each form submission = new session_id,
-- so history from a previous consultation never bleeds into a new one.
-- user_id is the numeric users.id, like every other per-user table (vitals,
-- medical_history...) -- mediassist_service decodes the frontend's signed
-- "uid" token back into this id before every query (see app.py's
-- _decode_user_id).
CREATE TABLE IF NOT EXISTS mediassist_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id VARCHAR(120) NOT NULL,
    role ENUM('user', 'assistant') NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (user_id, session_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
