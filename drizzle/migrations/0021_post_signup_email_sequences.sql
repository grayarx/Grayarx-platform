-- Post-signup email sequences for new dealerships
-- Tracks email templates and delivery status

CREATE TABLE IF NOT EXISTS `post_signup_email_sequences` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `dealership_id` INT NOT NULL,
  `sequence_type` ENUM('welcome', 'setup_guide', 'first_lead_tips') NOT NULL,
  `email_template_id` VARCHAR(255) NOT NULL,
  `recipient_email` VARCHAR(320) NOT NULL,
  `recipient_name` VARCHAR(255),
  `subject` VARCHAR(255) NOT NULL,
  `body_html` LONGTEXT NOT NULL,
  `scheduled_for` TIMESTAMP NOT NULL,
  `sent_at` TIMESTAMP NULL,
  `opened_at` TIMESTAMP NULL,
  `clicked_at` TIMESTAMP NULL,
  `bounced_at` TIMESTAMP NULL,
  `bounce_reason` VARCHAR(255),
  `status` ENUM('scheduled', 'sent', 'failed', 'bounced', 'opened', 'clicked') DEFAULT 'scheduled' NOT NULL,
  `tracking_pixel_id` VARCHAR(255),
  `sendgrid_message_id` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`dealership_id`) REFERENCES `dealerships`(`id`) ON DELETE CASCADE,
  INDEX `idx_dealership_scheduled` (`dealership_id`, `scheduled_for`),
  INDEX `idx_status` (`status`),
  INDEX `idx_sequence_type` (`sequence_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Track email sequence delivery history
CREATE TABLE IF NOT EXISTS `email_sequence_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `dealership_id` INT NOT NULL,
  `sequence_type` ENUM('welcome', 'setup_guide', 'first_lead_tips') NOT NULL,
  `email_sequence_id` INT NOT NULL,
  `attempt_number` INT DEFAULT 1,
  `sent_at` TIMESTAMP NULL,
  `error_message` TEXT,
  `retry_count` INT DEFAULT 0,
  `max_retries` INT DEFAULT 3,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`dealership_id`) REFERENCES `dealerships`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`email_sequence_id`) REFERENCES `post_signup_email_sequences`(`id`) ON DELETE CASCADE,
  INDEX `idx_dealership_sequence` (`dealership_id`, `sequence_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
