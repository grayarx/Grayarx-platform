CREATE TABLE `communication_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealership_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(50) NOT NULL,
	`subject` varchar(255),
	`body` text NOT NULL,
	`variables` json,
	`version` int DEFAULT 1,
	`status` varchar(20) DEFAULT 'draft',
	`approved_by` int,
	`approved_at` timestamp,
	`usage_count` int DEFAULT 0,
	`created_by` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `communication_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compliance_audit_trail` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealership_id` int NOT NULL,
	`user_id` int,
	`action` varchar(100) NOT NULL,
	`entity_type` varchar(50) NOT NULL,
	`entity_id` int NOT NULL,
	`description` text,
	`changes` json,
	`ip_address` varchar(45),
	`user_agent` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `compliance_audit_trail_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealership_id` int NOT NULL,
	`module_id` int NOT NULL,
	`assigned_to` int NOT NULL,
	`due_date` timestamp,
	`status` varchar(20) DEFAULT 'pending',
	`assigned_by` int NOT NULL,
	`assigned_at` timestamp DEFAULT (now()),
	`completed_at` timestamp,
	CONSTRAINT `training_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealership_id` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`topic` varchar(100) NOT NULL,
	`video_url` varchar(500),
	`duration` int,
	`content` text,
	`order` int DEFAULT 0,
	`is_published` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `training_modules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`module_id` int NOT NULL,
	`status` varchar(20) DEFAULT 'in_progress',
	`progress_percentage` int DEFAULT 0,
	`quiz_score` int,
	`completed_at` timestamp,
	`certificate_url` varchar(500),
	`started_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `training_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_quizzes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`module_id` int NOT NULL,
	`question` text NOT NULL,
	`options` json NOT NULL,
	`correct_answer` int NOT NULL,
	`explanation` text,
	`order` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `training_quizzes_id` PRIMARY KEY(`id`)
);
