CREATE TABLE `email_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealership_id` int NOT NULL,
	`type` varchar(64) NOT NULL,
	`recipient` varchar(320) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`status` enum('pending','sent','failed','bounced') NOT NULL DEFAULT 'pending',
	`sent_at` timestamp,
	`bounce_at` timestamp,
	`opened_at` timestamp,
	`clicked_at` timestamp,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_import_errors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`import_id` int NOT NULL,
	`row_number` int NOT NULL,
	`error_message` text NOT NULL,
	`raw_data` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_import_errors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_imports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealership_id` int NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`total_rows` int NOT NULL,
	`success_count` int NOT NULL DEFAULT 0,
	`error_count` int NOT NULL DEFAULT 0,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`imported_at` timestamp,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lead_imports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_quality_factors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lead_id` int NOT NULL,
	`source_score` decimal(3,2) NOT NULL DEFAULT '0.00',
	`language_score` decimal(3,2) NOT NULL DEFAULT '0.00',
	`response_time_score` decimal(3,2) NOT NULL DEFAULT '0.00',
	`engagement_score` decimal(3,2) NOT NULL DEFAULT '0.00',
	`vehicle_type_score` decimal(3,2) NOT NULL DEFAULT '0.00',
	`price_range_score` decimal(3,2) NOT NULL DEFAULT '0.00',
	`location_score` decimal(3,2) NOT NULL DEFAULT '0.00',
	`urgency_score` decimal(3,2) NOT NULL DEFAULT '0.00',
	`contact_quality_score` decimal(3,2) NOT NULL DEFAULT '0.00',
	`history_score` decimal(3,2) NOT NULL DEFAULT '0.00',
	`overall_score` decimal(3,2) NOT NULL DEFAULT '0.00',
	`factors` json,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lead_quality_factors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealership_id` int NOT NULL,
	`new_lead_enabled` tinyint NOT NULL DEFAULT 1,
	`lead_status_change_enabled` tinyint NOT NULL DEFAULT 1,
	`booking_request_enabled` tinyint NOT NULL DEFAULT 1,
	`preapproval_submission_enabled` tinyint NOT NULL DEFAULT 1,
	`notification_frequency` varchar(32) NOT NULL DEFAULT 'immediate',
	`quiet_hours_start` varchar(5),
	`quiet_hours_end` varchar(5),
	`timezone` varchar(64) NOT NULL DEFAULT 'Africa/Johannesburg',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_preferences_dealership_id_unique` UNIQUE(`dealership_id`)
);
--> statement-breakpoint
CREATE TABLE `performance_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealership_id` int NOT NULL,
	`date` date NOT NULL,
	`lead_volume` int NOT NULL DEFAULT 0,
	`lead_conversion_rate` decimal(5,2) NOT NULL DEFAULT '0.00',
	`avg_response_time` int NOT NULL DEFAULT 0,
	`revenue_impact` decimal(12,2) NOT NULL DEFAULT '0.00',
	`cost_per_lead` decimal(8,2) NOT NULL DEFAULT '0.00',
	`roi` decimal(5,2) NOT NULL DEFAULT '0.00',
	`booking_rate` decimal(5,2) NOT NULL DEFAULT '0.00',
	`preapproval_rate` decimal(5,2) NOT NULL DEFAULT '0.00',
	`avg_lead_quality` decimal(3,2) NOT NULL DEFAULT '0.00',
	`metrics` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `performance_metrics_id` PRIMARY KEY(`id`)
);
