-- MediAssist recommendations history
-- Flattened, one row per recommendation, persisted whenever a real (initial)
-- analysis produces at least one -- separate from mediassist_history (which
-- stores raw chat turns) so the AI Analysis page can fall back to a user's
-- past recommendations when the LLM gateway is unreachable and the current
-- turn comes back empty (see mediassist_service/app.py's chat route and the
-- /api/mediassist/recommendations-history route).
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
