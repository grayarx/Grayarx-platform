CREATE TABLE IF NOT EXISTS pilot_email_sends (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(320) NOT NULL,
  prospectId VARCHAR(128) NOT NULL,
  dealershipName VARCHAR(255) NOT NULL,
  segment VARCHAR(64) NOT NULL,
  resendId VARCHAR(128) NULL,
  sentAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pilot_email_sends_email (email),
  INDEX idx_pilot_email_sends_sent_at (sentAt)
);
