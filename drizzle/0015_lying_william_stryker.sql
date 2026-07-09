CREATE TABLE `vehicle_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`url` varchar(500) NOT NULL,
	`storageKey` varchar(255) NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`caption` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vehicle_photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `vehicles` ADD `bodyType` varchar(32);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `color` varchar(48);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `condition` enum('new','used','demo','certified') DEFAULT 'used' NOT NULL;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `vin` varchar(32);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `engineCc` int;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `doors` int;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `seats` int;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `features` json;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `serviceHistory` varchar(32);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `previousOwners` int;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `primaryPhotoUrl` varchar(500);