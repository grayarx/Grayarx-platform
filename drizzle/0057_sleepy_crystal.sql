CREATE TABLE `dealership_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealership_id` int,
	`user_id` int,
	`action` varchar(64) NOT NULL,
	`resource_type` varchar(64) NOT NULL,
	`resource_id` int,
	`resource_name` varchar(255),
	`old_value` json,
	`new_value` json,
	`ip_address` varchar(45),
	`user_agent` text,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dealership_audit_logs_id` PRIMARY KEY(`id`)
);
