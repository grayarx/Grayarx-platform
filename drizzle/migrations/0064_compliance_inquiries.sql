CREATE TABLE IF NOT EXISTS compliance_inquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mailbox ENUM('privacy', 'legal', 'hello', 'other') NOT NULL DEFAULT 'other',
  source ENUM('web_form', 'resend_inbound', 'manual') NOT NULL DEFAULT 'web_form',
  senderName VARCHAR(255),
  senderEmail VARCHAR(320) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('new', 'read', 'replied', 'archived') NOT NULL DEFAULT 'new',
  externalId VARCHAR(255),
  metadata JSON,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  readAt TIMESTAMP NULL,
  INDEX idx_compliance_status (status),
  INDEX idx_compliance_mailbox (mailbox),
  INDEX idx_compliance_created (createdAt)
);
