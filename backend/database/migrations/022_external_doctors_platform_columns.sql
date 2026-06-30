-- Give external_doctors everything the (soon to be removed) doctors table
-- had, so platform-added doctors can live here too: email (booking
-- confirmation emails), bio, availability JSON, and rating/rating_count.
-- source_url is med.tn-only, so it has to become nullable for
-- platform/OSM-sourced rows. osm_id is the upsert key for Overpass results.
ALTER TABLE external_doctors MODIFY COLUMN source_url VARCHAR(500) NULL;
ALTER TABLE external_doctors ADD COLUMN email VARCHAR(255) NULL UNIQUE AFTER name;
ALTER TABLE external_doctors ADD COLUMN osm_id VARCHAR(50) NULL UNIQUE AFTER source_url;
ALTER TABLE external_doctors ADD COLUMN bio VARCHAR(2000) DEFAULT '' AFTER location;
ALTER TABLE external_doctors ADD COLUMN availability TEXT DEFAULT NULL AFTER bio;
ALTER TABLE external_doctors ADD COLUMN rating DECIMAL(3, 2) DEFAULT NULL AFTER availability;
ALTER TABLE external_doctors ADD COLUMN rating_count INT NOT NULL DEFAULT 0 AFTER rating;

CREATE TABLE IF NOT EXISTS doctor_ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    user_id INT NOT NULL,
    rating TINYINT NOT NULL,
    review VARCHAR(2000) DEFAULT '',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES external_doctors(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
