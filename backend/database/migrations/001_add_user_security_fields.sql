-- Migration: add user security fields for verification, MFA, and lockout
ALTER TABLE users
  ADD COLUMN is_verified TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN verification_code VARCHAR(64) DEFAULT NULL,
  ADD COLUMN verification_expiry DATETIME DEFAULT NULL,
  ADD COLUMN mfa_enabled TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN mfa_code VARCHAR(16) DEFAULT NULL,
  ADD COLUMN mfa_expiry DATETIME DEFAULT NULL,
  ADD COLUMN failed_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN locked_until DATETIME DEFAULT NULL;
