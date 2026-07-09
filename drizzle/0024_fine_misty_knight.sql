CREATE TABLE `popia_consent_signatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`dealership_id` int NOT NULL,
	`signed_name` text NOT NULL,
	`ip_address` text NOT NULL,
	`user_agent` text NOT NULL,
	`form_version` text NOT NULL DEFAULT ('1.0'),
	`consent_text` text NOT NULL,
	`signed_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp NOT NULL,
	`reconfirmed_at` timestamp,
	`status` enum('active','expired','revoked') NOT NULL DEFAULT 'active',
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `popia_consent_signatures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `agent_activity` MODIFY COLUMN `agentId` enum('email','calling','booking','prospector','improvement','whatsapp','accountant','fallback','preapproval','tradein') NOT NULL;--> statement-breakpoint
ALTER TABLE `popia_consent_signatures` ADD CONSTRAINT `popia_consent_signatures_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `popia_consent_signatures` ADD CONSTRAINT `popia_consent_signatures_dealership_id_dealerships_id_fk` FOREIGN KEY (`dealership_id`) REFERENCES `dealerships`(`id`) ON DELETE no action ON UPDATE no action;