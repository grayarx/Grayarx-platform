CREATE TABLE `competitor_pricing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`make` varchar(64) NOT NULL,
	`model` varchar(64) NOT NULL,
	`year` int NOT NULL,
	`ourPrice` decimal(12,2),
	`competitorAveragePrice` decimal(12,2),
	`priceGap` decimal(12,2),
	`pricePercentile` int,
	`competitorCount` int,
	`marketTrend` varchar(32),
	`recommendedPrice` decimal(12,2),
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `competitor_pricing_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compliance_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`ruleType` varchar(64) NOT NULL,
	`jurisdiction` varchar(128) NOT NULL,
	`ruleName` varchar(255) NOT NULL,
	`description` text,
	`status` enum('compliant','at_risk','non_compliant','unknown') NOT NULL DEFAULT 'unknown',
	`lastChecked` timestamp,
	`nextCheckDue` timestamp,
	`suggestedActions` text,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `compliance_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_journey_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`dealershipId` int NOT NULL,
	`eventType` enum('website_visit','showroom_visit','test_drive','quote_request','trade_in_inquiry','financing_inquiry','email_open','email_click','phone_call','message','appointment_scheduled','appointment_completed','purchase','follow_up') NOT NULL,
	`eventDetails` json,
	`duration` int,
	`stageSequence` int,
	`timeToNextStage` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_journey_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_lifetime_value` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`dealershipId` int NOT NULL,
	`predictedClv` decimal(12,2),
	`clvSegment` varchar(32),
	`churnRisk` decimal(5,2),
	`retentionScore` decimal(5,2),
	`vehiclePurchaseValue` decimal(12,2),
	`serviceValue` decimal(12,2),
	`accessoriesValue` decimal(12,2),
	`financingValue` decimal(12,2),
	`recommendedOffer` varchar(255),
	`retentionStrategy` varchar(255),
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_lifetime_value_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_lifetime_value_leadId_unique` UNIQUE(`leadId`)
);
--> statement-breakpoint
CREATE TABLE `dealership_ai_agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`agentName` varchar(255) NOT NULL,
	`agentType` enum('lead_scorer','inventory_optimizer','service_predictor','pricing_intelligence','journey_mapper','compliance_monitor','clv_predictor','financing_advisor','general_assistant') NOT NULL,
	`customInstructions` text,
	`trainingData` json,
	`accuracy` decimal(5,2),
	`lastTrainedAt` timestamp,
	`status` enum('active','training','paused','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dealership_ai_agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dealership_locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`locationName` varchar(255) NOT NULL,
	`address` text NOT NULL,
	`city` varchar(128) NOT NULL,
	`province` varchar(128),
	`postalCode` varchar(16),
	`phone` varchar(32),
	`email` varchar(320),
	`monthlyLeads` int DEFAULT 0,
	`monthlyConversions` int DEFAULT 0,
	`averageInventory` int DEFAULT 0,
	`territory` varchar(128),
	`radius` int,
	`status` enum('active','inactive','closed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dealership_locations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `financing_intelligence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`dealershipId` int NOT NULL,
	`financingNeeded` int DEFAULT 1,
	`financingProbability` decimal(5,2),
	`estimatedLoanAmount` decimal(12,2),
	`estimatedDownPayment` decimal(12,2),
	`recommendedLoanTerm` int,
	`tradeInLikelihood` decimal(5,2),
	`estimatedTradeInValue` decimal(12,2),
	`tradeInVehicleType` varchar(64),
	`warrantyUpsellProbability` decimal(5,2),
	`accessoriesUpsellProbability` decimal(5,2),
	`approvalProbability` decimal(5,2),
	`recommendedLender` varchar(128),
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `financing_intelligence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_predictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`dealershipId` int NOT NULL,
	`daysToSell` int,
	`sellProbability` decimal(5,2),
	`optimalPrice` decimal(12,2),
	`priceAdjustmentRecommendation` decimal(12,2),
	`demandLevel` varchar(32),
	`marketAveragePrice` decimal(12,2),
	`competitorCount` int,
	`inventoryTurnoverRate` decimal(5,2),
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_predictions_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_predictions_vehicleId_unique` UNIQUE(`vehicleId`)
);
--> statement-breakpoint
CREATE TABLE `lead_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`dealershipId` int NOT NULL,
	`engagementScore` decimal(5,2) DEFAULT '0',
	`conversionProbability` decimal(5,2) DEFAULT '0',
	`estimatedDealValue` decimal(12,2) DEFAULT '0',
	`buyingUrgency` varchar(32),
	`recommendedContactTime` varchar(32),
	`recommendedSalesAgent` int,
	`predictedNextAction` varchar(255),
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_scores_id` PRIMARY KEY(`id`),
	CONSTRAINT `lead_scores_leadId_unique` UNIQUE(`leadId`)
);
--> statement-breakpoint
CREATE TABLE `service_predictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`dealershipId` int NOT NULL,
	`nextServiceDue` date,
	`daysUntilService` int,
	`predictedServiceType` varchar(255),
	`estimatedServiceCost` decimal(12,2),
	`bookingProbability` decimal(5,2),
	`recommendedReminderTime` varchar(32),
	`suggestedIncentive` varchar(255),
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `service_predictions_id` PRIMARY KEY(`id`)
);
