CREATE TABLE `dealership_payouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`payoutPeriodStart` date NOT NULL,
	`payoutPeriodEnd` date NOT NULL,
	`totalSalesCount` int NOT NULL,
	`totalSalesAmount` decimal(12,2) NOT NULL,
	`dealershipShare` decimal(12,2) NOT NULL,
	`grayarxShare` decimal(12,2) NOT NULL,
	`status` enum('pending','processed','paid') NOT NULL DEFAULT 'pending',
	`paidDate` timestamp,
	`bankDetails` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dealership_payouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketplace_sales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`customerEmail` varchar(320),
	`customerPhone` varchar(32),
	`salePrice` decimal(12,2) NOT NULL,
	`grayarxCommission` decimal(12,2) NOT NULL,
	`dealershipRevenue` decimal(12,2) NOT NULL,
	`source` enum('showroom','walk_in','direct_call') NOT NULL DEFAULT 'showroom',
	`status` enum('inquiry','test_drive_booked','test_drive_completed','sold','lost') NOT NULL DEFAULT 'inquiry',
	`saleDate` timestamp,
	`invoiceId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketplace_sales_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `showroom_inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`customerName` varchar(255),
	`customerEmail` varchar(320),
	`customerPhone` varchar(32),
	`inquiryText` text NOT NULL,
	`aiResponse` text,
	`status` enum('new','responded','booked','converted','lost') NOT NULL DEFAULT 'new',
	`convertedToSaleId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `showroom_inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `support_agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`name` varchar(100) NOT NULL DEFAULT 'Support Agent',
	`avatarUrl` varchar(500),
	`brandColor` varchar(7) NOT NULL DEFAULT '#d4af37',
	`personalityTone` enum('formal','casual','friendly','urgent') NOT NULL DEFAULT 'professional',
	`customGreeting` varchar(255) NOT NULL DEFAULT 'Hi! I''m here to help.',
	`isActive` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `support_agents_id` PRIMARY KEY(`id`),
	CONSTRAINT `support_agents_dealershipId_unique` UNIQUE(`dealershipId`)
);
--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` enum('bug','feature_request','user_error','performance','other') NOT NULL DEFAULT 'bug',
	`severity` enum('critical','high','medium','low') NOT NULL DEFAULT 'medium',
	`status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`kagisoReferenceId` int,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `support_tickets_id` PRIMARY KEY(`id`)
);
