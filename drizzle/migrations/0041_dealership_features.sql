CREATE TABLE IF NOT EXISTS `dealerships` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `registrationNumber` varchar(100) UNIQUE,
  `phone` varchar(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `city` varchar(100) NOT NULL,
  `province` varchar(100) NOT NULL,
  `zipCode` varchar(10) NOT NULL,
  `website` varchar(255),
  `logo` varchar(255),
  `status` enum('active', 'inactive', 'suspended') DEFAULT 'active',
  `subscriptionTier` enum('starter', 'professional', 'enterprise') DEFAULT 'starter',
  `metadata` json,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `dealershipId` int NOT NULL,
  `vin` varchar(17) NOT NULL UNIQUE,
  `make` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  `year` int NOT NULL,
  `color` varchar(50),
  `mileage` int DEFAULT 0,
  `price` decimal(10, 2) NOT NULL,
  `status` enum('available', 'sold', 'reserved', 'maintenance') DEFAULT 'available',
  `condition` enum('new', 'used', 'certified_pre_owned') NOT NULL,
  `fuelType` varchar(20),
  `transmission` varchar(20),
  `imageUrl` text,
  `metadata` json,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL,
  FOREIGN KEY (`dealershipId`) REFERENCES `dealerships`(`id`)
);

CREATE TABLE IF NOT EXISTS `customers` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `dealershipId` int NOT NULL,
  `firstName` varchar(100) NOT NULL,
  `lastName` varchar(100) NOT NULL,
  `email` varchar(255) UNIQUE,
  `phone` varchar(20) NOT NULL,
  `idNumber` varchar(20) UNIQUE,
  `address` text,
  `city` varchar(100),
  `province` varchar(100),
  `zipCode` varchar(10),
  `source` enum('walk_in', 'phone', 'email', 'website', 'referral', 'trade_in') NOT NULL,
  `status` enum('lead', 'prospect', 'customer', 'inactive') DEFAULT 'lead',
  `preferredContact` enum('email', 'phone', 'sms', 'whatsapp') DEFAULT 'phone',
  `metadata` json,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL,
  FOREIGN KEY (`dealershipId`) REFERENCES `dealerships`(`id`)
);

CREATE TABLE IF NOT EXISTS `leads` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `dealershipId` int NOT NULL,
  `customerId` int NOT NULL,
  `vehicleId` int,
  `interestLevel` enum('hot', 'warm', 'cold') DEFAULT 'warm',
  `stage` enum('inquiry', 'test_drive_scheduled', 'test_drive_completed', 'negotiation', 'finance_review', 'closed_won', 'closed_lost') DEFAULT 'inquiry',
  `assignedTo` int,
  `followUpDate` timestamp NULL,
  `notes` text,
  `metadata` json,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`dealershipId`) REFERENCES `dealerships`(`id`),
  FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`),
  FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`)
);

CREATE TABLE IF NOT EXISTS `test_drives` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `dealershipId` int NOT NULL,
  `leadId` int NOT NULL,
  `customerId` int NOT NULL,
  `vehicleId` int NOT NULL,
  `scheduledDate` timestamp NOT NULL,
  `completedDate` timestamp NULL,
  `status` enum('scheduled', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
  `notes` text,
  `rating` int,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`dealershipId`) REFERENCES `dealerships`(`id`),
  FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`),
  FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`),
  FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`)
);

CREATE TABLE IF NOT EXISTS `financing` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `dealershipId` int NOT NULL,
  `leadId` int NOT NULL,
  `customerId` int NOT NULL,
  `vehicleId` int NOT NULL,
  `downPayment` decimal(10, 2) NOT NULL,
  `loanAmount` decimal(10, 2) NOT NULL,
  `interestRate` decimal(5, 2) NOT NULL,
  `loanTerm` int NOT NULL,
  `monthlyPayment` decimal(10, 2) NOT NULL,
  `status` enum('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
  `bankName` varchar(100),
  `bankReference` varchar(100),
  `metadata` json,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`dealershipId`) REFERENCES `dealerships`(`id`),
  FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`),
  FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`),
  FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`)
);

CREATE TABLE IF NOT EXISTS `dealership_users` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `dealershipId` int NOT NULL,
  `userId` int NOT NULL,
  `role` enum('manager', 'sales_consultant', 'finance_manager', 'admin') NOT NULL,
  `performanceMetrics` json,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`dealershipId`) REFERENCES `dealerships`(`id`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `sales_pipeline` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `dealershipId` int NOT NULL,
  `leadId` int NOT NULL,
  `stage` enum('inquiry', 'test_drive', 'negotiation', 'finance', 'closing', 'closed') NOT NULL,
  `stageEnteredAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `estimatedCloseDate` timestamp NULL,
  `probability` int DEFAULT 50,
  `notes` text,
  `metadata` json,
  FOREIGN KEY (`dealershipId`) REFERENCES `dealerships`(`id`),
  FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`)
);
