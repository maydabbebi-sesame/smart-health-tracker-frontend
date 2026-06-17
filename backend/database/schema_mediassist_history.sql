-- MediAssist conversation history
-- Scoped by (user_uid, session_id): each form submission = new session_id,
-- so history from a previous consultation never bleeds into a new one.
CREATE TABLE IF NOT EXISTS mediassist_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_uid VARCHAR(255) NOT NULL,
    session_id VARCHAR(120) NOT NULL,
    role ENUM('user', 'assistant') NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (user_uid, session_id)
);
