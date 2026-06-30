-- appointments table schema for SmartHealth
-- Every doctor (platform-added, med.tn-scraped, or OSM-sourced) lives in
-- external_doctors, so doctor_id is a single FK there. The name/
-- specialization/location snapshot is kept because the referenced
-- external_doctors row can change or disappear later (e.g. a re-scrape).
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    doctor_id INT NOT NULL,
    doctor_name VARCHAR(255) NULL,
    doctor_specialization VARCHAR(255) NULL,
    doctor_location VARCHAR(255) NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    reason varchar(2000) DEFAULT '',
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    reminder_days INT NOT NULL DEFAULT 1,
    reminder_sent TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (doctor_id) REFERENCES external_doctors(id)
);
