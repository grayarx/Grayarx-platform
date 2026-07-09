CREATE TABLE `help_articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`content` text NOT NULL,
	`excerpt` varchar(500),
	`keywords` text,
	`video_url` varchar(500),
	`order` int DEFAULT 0,
	`views` int DEFAULT 0,
	`is_published` tinyint DEFAULT 1,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `help_articles_id` PRIMARY KEY(`id`),
	CONSTRAINT `help_articles_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `help_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`article_id` int,
	`tour_id` int,
	`rating` int,
	`comment` text,
	`helpful` tinyint,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `help_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tour_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`target_element` varchar(255),
	`position` enum('top','bottom','left','right') DEFAULT 'bottom',
	`action` varchar(100),
	`action_target` varchar(255),
	`order` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `onboarding_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_tours` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`target_role` enum('user','admin','dealer_owner','dealer_consultant') NOT NULL,
	`target_page` varchar(255) NOT NULL,
	`order` int DEFAULT 0,
	`is_active` tinyint DEFAULT 1,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboarding_tours_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tooltips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`element_id` varchar(255) NOT NULL,
	`title` varchar(255),
	`content` text NOT NULL,
	`position` enum('top','bottom','left','right') DEFAULT 'top',
	`trigger_type` enum('hover','click','focus') DEFAULT 'hover',
	`delay` int DEFAULT 0,
	`is_active` tinyint DEFAULT 1,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tooltips_id` PRIMARY KEY(`id`),
	CONSTRAINT `tooltips_element_id_unique` UNIQUE(`element_id`)
);
--> statement-breakpoint
CREATE TABLE `user_onboarding_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`tour_id` int NOT NULL,
	`status` enum('not_started','in_progress','completed','skipped') DEFAULT 'not_started',
	`current_step` int DEFAULT 0,
	`completed_at` timestamp,
	`started_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_onboarding_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_tooltip_dismissals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`tooltip_id` int NOT NULL,
	`dismissed_at` timestamp DEFAULT (now()),
	CONSTRAINT `user_tooltip_dismissals_id` PRIMARY KEY(`id`)
);
