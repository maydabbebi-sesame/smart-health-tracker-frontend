-- Adds a flattened, persisted history of MediAssist recommendations,
-- separate from mediassist_history's raw chat turns. The AI Analysis page's
-- recommendations panel currently lives only in client-side Zustand state, so
-- it goes empty whenever the LLM gateway is unreachable and a turn falls back
-- to the generic empty response (see mediassist_service/llm_client.py's
-- FALLBACK_RESPONSE). Persisting each real recommendation lets the page show
-- the user's last known-good recommendations instead of nothing in that case
-- (see app.py's new /api/mediassist/recommendations-history route).
CREATE TABLE IF NOT EXISTS mediassist_recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id VARCHAR(120) NOT NULL,
    titre VARCHAR(255) NOT NULL,
    detail TEXT,
    pourquoi TEXT,
    priorite ENUM('haute', 'moyenne', 'basse') NOT NULL DEFAULT 'basse',
    urgence ENUM('normale', 'moderee', 'elevee', 'critique') NOT NULL DEFAULT 'normale',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_created (user_id, created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
