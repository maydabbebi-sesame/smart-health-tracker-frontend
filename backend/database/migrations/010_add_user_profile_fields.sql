-- 010_add_user_profile_fields.sql
-- Migration: add editable profile columns referenced by PUT /api/users/profile
-- and POST /api/users/profile-picture

ALTER TABLE users ADD COLUMN phone VARCHAR(50) DEFAULT NULL;
ALTER TABLE users ADD COLUMN address VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN date_of_birth DATE DEFAULT NULL;
ALTER TABLE users ADD COLUMN gender VARCHAR(50) DEFAULT NULL;
ALTER TABLE users ADD COLUMN emergency_contact VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN profile_picture VARCHAR(255) DEFAULT NULL;
