-- A med.tn detail page can list more than one phone number (e.g. personal and
-- secretary line), joined with a separator by the scraper -- VARCHAR(50)
-- overflowed on a real record during testing.
ALTER TABLE vitals
    ADD COLUMN physical_activity VARCHAR(255) DEFAULT NULL,
    ADD COLUMN diet TEXT DEFAULT NULL,
    ADD COLUMN sleep_quality VARCHAR(100) DEFAULT NULL,
    ADD COLUMN stress_level INT DEFAULT NULL;
