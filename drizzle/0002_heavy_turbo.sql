CREATE TABLE `prospects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipName` varchar(255) NOT NULL,
	`region` varchar(128),
	`city` varchar(128),
	`phone` varchar(32),
	`email` varchar(320),
	`website` varchar(500),
	`estimatedMonthlyVolume` int,
	`brandsCarried` text,
	`score` int NOT NULL DEFAULT 0,
	`rationale` text,
	`status` enum('new','scouted','queued_for_call','called','contacted','converted','rejected') NOT NULL DEFAULT 'new',
	`sourceNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prospects_id` PRIMARY KEY(`id`)
);
