-- vitals table schema for SmartHealth
CREATE TABLE IF NOT EXISTS vitals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    -- Device measures (optional — step 2 of the symptom form)
    heart_rate INT DEFAULT NULL,
    systolic_bp INT DEFAULT NULL,
    diastolic_bp INT DEFAULT NULL,
    temperature FLOAT DEFAULT NULL,
    oxygen_saturation FLOAT DEFAULT NULL,
    respiratory_rate INT DEFAULT NULL,
    glycemia FLOAT DEFAULT NULL,
    -- Personal info
    age INT DEFAULT NULL,
    gender VARCHAR(50) DEFAULT NULL,
    height INT DEFAULT NULL,
    weight FLOAT DEFAULT NULL,
    weight_variation VARCHAR(50) DEFAULT NULL,
    weight_variation_kg FLOAT DEFAULT NULL,
    pregnancy_status VARCHAR(50) DEFAULT NULL,
    -- Medical history
    health_issues_history TEXT DEFAULT NULL,
    drug_allergies_flag BOOLEAN DEFAULT NULL,
    drug_allergies TEXT DEFAULT NULL,
    family_health_issues TEXT DEFAULT NULL,
    -- Lifestyle
    smoking BOOLEAN DEFAULT NULL,
    cigarettes_per_day INT DEFAULT NULL,
    alcohol BOOLEAN DEFAULT NULL,
    alcohol_glasses INT DEFAULT NULL,
    physical_activity VARCHAR(255) DEFAULT NULL,
    diet TEXT DEFAULT NULL,
    sleep_quality VARCHAR(100) DEFAULT NULL,
    stress_level INT DEFAULT NULL,
    -- Treatments
    current_treatment BOOLEAN DEFAULT NULL,
    current_treatments TEXT DEFAULT NULL,
    complements BOOLEAN DEFAULT NULL,
    complements_text TEXT DEFAULT NULL,
    observance VARCHAR(255) DEFAULT NULL,
    -- Symptoms
    symptoms TEXT DEFAULT NULL,
    pain_intensity INT DEFAULT NULL,
    symptoms_description TEXT DEFAULT NULL,
    symptoms_duration VARCHAR(255) DEFAULT NULL,
    pain_location TEXT DEFAULT NULL,
    triggers TEXT DEFAULT NULL,
    general_state VARCHAR(255) DEFAULT NULL,
    -- Free-text notes
    notes TEXT DEFAULT NULL,
    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
