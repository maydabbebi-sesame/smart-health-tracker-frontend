-- A med.tn detail page can list more than one phone number (e.g. personal and
-- secretary line), joined with a separator by the scraper -- VARCHAR(50)
-- overflowed on a real record during testing.
ALTER TABLE vitals
    ADD COLUMN pregnancy_status VARCHAR(50) DEFAULT NULL;
