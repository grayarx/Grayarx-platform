ALTER TABLE `leads` ADD `dealershipId` int;--> statement-breakpoint
ALTER TABLE `leads` ADD `assignedTo` int;--> statement-breakpoint
ALTER TABLE `leads` ADD `qualityScore` decimal(3,2);--> statement-breakpoint
ALTER TABLE `test_drives` ADD `appointmentTime` varchar(8);