CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(255),
	`phone` varchar(20) NOT NULL,
	`idNumber` varchar(20),
	`address` text,
	`city` varchar(100),
	`province` varchar(100),
	`zipCode` varchar(10),
	`source` enum('walk_in','phone','email','website','referral','trade_in') NOT NULL,
	`status` enum('lead','prospect','customer','inactive') DEFAULT 'lead',
	`preferredContact` enum('email','phone','sms','whatsapp') DEFAULT 'phone',
	`metadata` json,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	`deletedAt` timestamp,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_email_unique` UNIQUE(`email`),
	CONSTRAINT `customers_idNumber_unique` UNIQUE(`idNumber`)
);
--> statement-breakpoint
CREATE TABLE `dealership_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('manager','sales_consultant','finance_manager','admin') NOT NULL,
	`performanceMetrics` json,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dealership_users_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`performedBy` varchar(255) NOT NULL,
	`performedAt` timestamp NOT NULL DEFAULT (now()),
	`details` json,
	CONSTRAINT `document_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_signatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`status` enum('pending','signed','declined','expired') NOT NULL DEFAULT 'pending',
	`signatureLink` varchar(500),
	`signedAt` timestamp,
	`signatureImage` varchar(500),
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `document_signatures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int,
	`name` varchar(255) NOT NULL,
	`category` varchar(64) NOT NULL,
	`content` text NOT NULL,
	`variables` json,
	`isCustom` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `document_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`customerId` int NOT NULL,
	`templateId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` varchar(64) NOT NULL,
	`status` enum('draft','pending_signature','signed','archived') NOT NULL DEFAULT 'draft',
	`content` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`signedAt` timestamp,
	`signedBy` varchar(255),
	`downloadUrl` varchar(500),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `financing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`leadId` int NOT NULL,
	`customerId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`downPayment` decimal(10,2) NOT NULL,
	`loanAmount` decimal(10,2) NOT NULL,
	`interestRate` decimal(5,2) NOT NULL,
	`loanTerm` int NOT NULL,
	`monthlyPayment` decimal(10,2) NOT NULL,
	`status` enum('pending','approved','rejected','completed') DEFAULT 'pending',
	`bankName` varchar(100),
	`bankReference` varchar(100),
	`metadata` json,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financing_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `maintenance_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`serviceType` varchar(128) NOT NULL,
	`interval` varchar(64) NOT NULL,
	`nextDueDate` timestamp,
	`nextDueMileage` int,
	`lastServiceDate` timestamp,
	`lastServiceMileage` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `maintenance_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reminder_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`customerId` int NOT NULL,
	`serviceType` varchar(128) NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`channel` enum('sms','email') NOT NULL,
	`status` enum('sent','delivered','failed') NOT NULL,
	`appointmentBooked` boolean NOT NULL DEFAULT false,
	`responseTime` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reminder_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reminder_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`serviceType` varchar(128) NOT NULL,
	`interval` varchar(64) NOT NULL,
	`reminderDaysBefore` int NOT NULL,
	`channel` enum('sms','email','both') NOT NULL DEFAULT 'sms',
	`enabled` boolean NOT NULL DEFAULT true,
	`messageTemplate` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reminder_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `service_reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`customerId` int NOT NULL,
	`serviceType` varchar(128) NOT NULL,
	`dueDate` timestamp NOT NULL,
	`dueMileage` int,
	`status` enum('pending','sent','delivered','booked','completed','skipped') NOT NULL DEFAULT 'pending',
	`channel` enum('sms','email','both') NOT NULL DEFAULT 'sms',
	`sentAt` timestamp,
	`respondedAt` timestamp,
	`appointmentBooked` boolean NOT NULL DEFAULT false,
	`appointmentDate` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `service_reminders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `test_drives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`leadId` int NOT NULL,
	`customerId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`scheduledDate` timestamp NOT NULL,
	`completedDate` timestamp,
	`status` enum('scheduled','completed','cancelled','no_show') DEFAULT 'scheduled',
	`notes` text,
	`rating` int,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `test_drives_id` PRIMARY KEY(`id`)
);
