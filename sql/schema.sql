-- Spustiť raz v databáze aplikácie.
-- Leady z /software/contact/ a pokusy pre limit 5 za hodinu.

CREATE TABLE IF NOT EXISTS leads (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  help VARCHAR(80) NOT NULL,
  project TEXT NOT NULL,
  engagement VARCHAR(80) NOT NULL,
  budget VARCHAR(40) NOT NULL,
  start_when VARCHAR(40) NOT NULL,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL,
  company VARCHAR(200) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  qualified TINYINT(1) NULL,
  ip_hash CHAR(64) NULL,
  user_agent VARCHAR(300) NULL,
  PRIMARY KEY (id),
  CONSTRAINT leads_status_chk CHECK (status IN ('new', 'replied', 'call', 'won', 'not_fit'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lead_attempts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ip_hash CHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY lead_attempts_ip_created (ip_hash, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
