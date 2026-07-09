CREATE TABLE `analytics_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`eventDataJson` json,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `landing_page_conversions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageId` int NOT NULL,
	`visitorId` varchar(255) NOT NULL,
	`actionType` enum('view','click','form_submit','call') NOT NULL,
	`convertedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `landing_page_conversions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `landing_page_sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageId` int NOT NULL,
	`sectionType` varchar(64) NOT NULL,
	`contentJson` json NOT NULL,
	`order` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `landing_page_sections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `landing_pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`slug` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`headline` varchar(255) NOT NULL,
	`subheadline` text,
	`ctaText` varchar(100) NOT NULL DEFAULT 'Get Started',
	`templateType` enum('lead_magnet','demo_request','vehicle_showcase') NOT NULL DEFAULT 'lead_magnet',
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `landing_pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `landing_pages_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`recipientPhone` varchar(32) NOT NULL,
	`notificationType` enum('booking_confirmation','booking_reminder','lead_alert','payout_notification','system_alert') NOT NULL,
	`channel` enum('sms','whatsapp','email') NOT NULL,
	`messageContent` text NOT NULL,
	`status` enum('pending','sent','failed','delivered') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`reportType` enum('sales','leads','agents','revenue','custom') NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`dataJson` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stripe_customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`stripeCustomerId` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stripe_customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `stripe_customers_dealershipId_unique` UNIQUE(`dealershipId`),
	CONSTRAINT `stripe_customers_stripeCustomerId_unique` UNIQUE(`stripeCustomerId`)
);
--> statement-breakpoint
CREATE TABLE `stripe_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`stripeSubscriptionId` varchar(255) NOT NULL,
	`planId` varchar(64) NOT NULL,
	`status` enum('active','past_due','canceled','unpaid') NOT NULL DEFAULT 'active',
	`currentPeriodStart` timestamp NOT NULL,
	`currentPeriodEnd` timestamp NOT NULL,
	`canceledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stripe_subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `stripe_subscriptions_stripeSubscriptionId_unique` UNIQUE(`stripeSubscriptionId`)
);
