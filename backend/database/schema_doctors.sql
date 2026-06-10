-- doctors table schema for SmartHealth
CREATE TABLE IF NOT EXISTS doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    location VARCHAR(255) DEFAULT '',
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NOT NULL,
    bio VARCHAR(2000) DEFAULT '',
    availability TEXT DEFAULT NULL
);
