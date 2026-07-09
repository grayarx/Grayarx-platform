CREATE TABLE `payfast_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`invoiceId` int,
	`payfastReference` varchar(100) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`description` varchar(255),
	`paymentMethod` varchar(64),
	`status` enum('pending','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`payfastResponse` text,
	`completedAt` timestamp,
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payfast_transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `payfast_transactions_payfastReference_unique` UNIQUE(`payfastReference`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`plan` enum('starter','professional','enterprise') NOT NULL,
	`monthlyPriceZar` decimal(10,2) NOT NULL,
	`billingCycleStart` date NOT NULL,
	`billingCycleEnd` date NOT NULL,
	`nextRenewalDate` date NOT NULL,
	`status` enum('active','paused','cancelled') NOT NULL DEFAULT 'active',
	`autoRenew` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_dealershipId_unique` UNIQUE(`dealershipId`)
);
