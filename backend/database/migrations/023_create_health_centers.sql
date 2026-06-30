-- Clinics/hospitals found via the Overpass API (OpenStreetMap) are saved
-- here, separately from individual practitioners (which go to
-- external_doctors instead) so the Doctor Agent can group "Médecins" vs
-- "Centres de santé" from real stored data rather than a live-only OSM call.
CREATE TABLE IF NOT EXISTS health_centers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source VARCHAR(20) NOT NULL DEFAULT 'osm',
    osm_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    location VARCHAR(255) DEFAULT '',
    phone VARCHAR(255) DEFAULT NULL,
    email VARCHAR(255) DEFAULT NULL,
    website VARCHAR(500) DEFAULT NULL,
    lat DECIMAL(10, 7) NULL,
    lng DECIMAL(10, 7) NULL,
    scraped_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
