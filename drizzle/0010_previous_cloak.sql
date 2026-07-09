CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`leadId` int NOT NULL,
	`invoiceNumber` varchar(50) NOT NULL,
	`invoiceDate` timestamp NOT NULL DEFAULT (now()),
	`dueDate` date NOT NULL,
	`vehicleId` int NOT NULL,
	`subtotal` decimal(10,2) NOT NULL,
	`vatAmount` decimal(10,2) NOT NULL,
	`totalAmount` decimal(10,2) NOT NULL,
	`status` enum('draft','sent','paid','overdue') NOT NULL DEFAULT 'draft',
	`pdfUrl` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`paymentDate` date NOT NULL,
	`paymentMethod` enum('bank_transfer','card','cash','cheque') NOT NULL,
	`reference` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vat_reconciliation` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`periodStart` date NOT NULL,
	`periodEnd` date NOT NULL,
	`totalInvoices` int NOT NULL,
	`totalVatCollected` decimal(10,2) NOT NULL,
	`vatDueDate` date NOT NULL,
	`status` enum('pending','submitted','paid') NOT NULL DEFAULT 'pending',
	`flagged` tinyint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vat_reconciliation_id` PRIMARY KEY(`id`)
);
