CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipName` varchar(255) NOT NULL,
	`contactName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`preferredDate` varchar(16) NOT NULL,
	`preferredTime` varchar(8) NOT NULL,
	`notes` text,
	`status` enum('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int,
	`channel` enum('email','voice','whatsapp','webchat','sms') NOT NULL,
	`agentType` enum('email','calling','booking','human') NOT NULL,
	`direction` enum('inbound','outbound') NOT NULL,
	`subject` varchar(255),
	`transcript` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipName` varchar(255) NOT NULL,
	`contactName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`monthlyVehicles` int,
	`notes` text,
	`source` varchar(64) DEFAULT 'website',
	`status` enum('new','contacted','qualified','converted','lost') NOT NULL DEFAULT 'new',
	`language` varchar(8) DEFAULT 'en',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int,
	`title` varchar(255) NOT NULL,
	`make` varchar(64),
	`model` varchar(64),
	`year` int,
	`price` decimal(12,2) NOT NULL,
	`km` int,
	`fuel` varchar(32),
	`transmission` varchar(32),
	`imageUrl` varchar(500),
	`location` varchar(128),
	`description` text,
	`status` enum('available','reserved','sold') NOT NULL DEFAULT 'available',
	`views` int NOT NULL DEFAULT 0,
	`leadCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`)
);
