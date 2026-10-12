-- Spustiť raz na databáze, ktorá vznikla zo staršieho sql/schema.sql.
-- Nová inštalácia má tieto stĺpce už v sql/schema.sql.
-- CHECK na status sa nemení.

ALTER TABLE leads
  ADD COLUMN utm_source VARCHAR(200) NULL,
  ADD COLUMN utm_medium VARCHAR(200) NULL,
  ADD COLUMN utm_campaign VARCHAR(200) NULL,
  ADD COLUMN utm_content VARCHAR(200) NULL,
  ADD COLUMN utm_term VARCHAR(200) NULL,
  ADD COLUMN fbclid VARCHAR(512) NULL,
  ADD COLUMN fbp VARCHAR(255) NULL,
  ADD COLUMN fbc VARCHAR(512) NULL,
  ADD COLUMN meta_event_id CHAR(36) NULL,
  ADD COLUMN marketing_consent TINYINT(1) NOT NULL DEFAULT 0;
