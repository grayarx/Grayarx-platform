CREATE TABLE `dealership_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealership_id` int NOT NULL,
	`plan_id` int NOT NULL,
	`tier` varchar(50) NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'active',
	`start_date` timestamp NOT NULL,
	`renewal_date` timestamp NOT NULL,
	`cancelled_at` timestamp,
	`trial_ends_at` timestamp,
	`is_trial_active` tinyint DEFAULT 0,
	`usage_data` json NOT NULL DEFAULT ('{}'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dealership_subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `dealership_subscriptions_dealership_id_unique` UNIQUE(`dealership_id`)
);
--> statement-breakpoint
CREATE TABLE `feature_access_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealership_id` int NOT NULL,
	`user_id` int,
	`feature` varchar(255) NOT NULL,
	`action` varchar(50) NOT NULL,
	`reason` varchar(255),
	`metadata` json,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feature_access_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feature_definitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feature_id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(64) NOT NULL,
	`is_limited` tinyint DEFAULT 0,
	`default_limit` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feature_definitions_id` PRIMARY KEY(`id`),
	CONSTRAINT `feature_definitions_feature_id_unique` UNIQUE(`feature_id`)
);
--> statement-breakpoint
CREATE TABLE `subscription_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tier` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`monthly_price` decimal(10,2) NOT NULL,
	`description` text,
	`features` json NOT NULL,
	`limits` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscription_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_plans_tier_unique` UNIQUE(`tier`)
);
