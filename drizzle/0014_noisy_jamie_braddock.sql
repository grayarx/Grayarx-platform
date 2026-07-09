ALTER TABLE `dealerships` ADD `publicShortcode` varchar(12);--> statement-breakpoint
ALTER TABLE `dealerships` ADD CONSTRAINT `dealerships_publicShortcode_unique` UNIQUE(`publicShortcode`);