-- GPS coordinates for scraped doctors, read from their med.tn profile page
-- (the "Itinéraire" Google Maps link embeds them in plain HTML) — lets the
-- Doctor Agent offer real directions for med.tn-sourced doctors too, not
-- just OpenStreetMap centers.
ALTER TABLE external_doctors
    ADD COLUMN lat DECIMAL(10, 7) NULL,
    ADD COLUMN lng DECIMAL(10, 7) NULL;
