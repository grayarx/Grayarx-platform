CREATE TABLE `popia_consent_signatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`dealership_id` int NOT NULL,
	`signed_name` text NOT NULL,
	`ip_address` text NOT NULL,
	`user_agent` text NOT NULL,
	`form_version` text NOT NULL DEFAULT '1.0',
	`consent_text` text NOT NULL,
	`signed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`expires_at` timestamp NOT NULL,
	`reconfirmed_at` timestamp,
	`status` enum('active','expired','revoked') NOT NULL DEFAULT 'active',
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `popia_consent_signatures_id` PRIMARY KEY(`id`),
	CONSTRAINT `popia_consent_signatures_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `popia_consent_signatures_dealership_id_dealerships_id_fk` FOREIGN KEY (`dealership_id`) REFERENCES `dealerships`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE INDEX `idx_user_dealership_status` ON `popia_consent_signatures` (`user_id`,`dealership_id`,`status`);
--> statement-breakpoint
CREATE INDEX `idx_signed_at` ON `popia_consent_signatures` (`signed_at`);
