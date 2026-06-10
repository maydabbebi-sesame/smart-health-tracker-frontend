-- users table schema for SmartHealth
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE
    , password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    is_verified TINYINT(1) NOT NULL DEFAULT 0,
    verification_code VARCHAR(64) DEFAULT NULL,
    verification_expiry DATETIME DEFAULT NULL,
    mfa_enabled TINYINT(1) NOT NULL DEFAULT 0,
    mfa_code VARCHAR(16) DEFAULT NULL,
    mfa_expiry DATETIME DEFAULT NULL,
    provider VARCHAR(50) DEFAULT NULL,
    provider_id VARCHAR(255) DEFAULT NULL,
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until DATETIME DEFAULT NULL
);
