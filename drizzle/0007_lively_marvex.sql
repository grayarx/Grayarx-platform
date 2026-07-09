CREATE TABLE `kagiso_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingsJson` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kagiso_settings_id` PRIMARY KEY(`id`)
);
