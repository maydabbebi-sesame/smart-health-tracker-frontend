-- External doctors directory (scraped from third-party sites like med.tn).
-- Kept separate from `doctors` (platform accounts with login/email/appointments)
-- since scraped entries have no login and often no public phone/email.
CREATE TABLE IF NOT EXISTS external_doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    source_url VARCHAR(500) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    location VARCHAR(255) DEFAULT '',
    phone VARCHAR(50) DEFAULT NULL,
    scraped_at DATETIME NOT NULL
);
