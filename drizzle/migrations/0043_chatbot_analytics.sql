-- Chatbot Analytics Tables

-- Conversation analytics - tracks individual conversations
CREATE TABLE IF NOT EXISTS `chatbot_conversations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` VARCHAR(255) NOT NULL UNIQUE,
  `user_id` INT,
  `dealership_id` INT,
  `message_count` INT DEFAULT 0,
  `sentiment_avg` DECIMAL(4, 2),
  `sentiment_min` DECIMAL(4, 2),
  `sentiment_max` DECIMAL(4, 2),
  `duration_seconds` INT,
  `language` VARCHAR(8) DEFAULT 'en',
  `intent_primary` VARCHAR(64),
  `escalated` TINYINT DEFAULT 0,
  `escalation_reason` VARCHAR(255),
  `satisfaction_score` DECIMAL(4, 2),
  `feedback` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `ended_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_dealership_created` (`dealership_id`, `created_at`),
  INDEX `idx_session_id` (`session_id`),
  INDEX `idx_language` (`language`)
);

-- Sentiment trends - aggregated daily sentiment data
CREATE TABLE IF NOT EXISTS `chatbot_sentiment_trends` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `dealership_id` INT,
  `date` DATE NOT NULL,
  `positive_count` INT DEFAULT 0,
  `neutral_count` INT DEFAULT 0,
  `negative_count` INT DEFAULT 0,
  `average_sentiment` DECIMAL(4, 2),
  `escalation_count` INT DEFAULT 0,
  `total_conversations` INT DEFAULT 0,
  `avg_satisfaction` DECIMAL(4, 2),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_dealership_date` (`dealership_id`, `date`),
  INDEX `idx_dealership_date` (`dealership_id`, `date`)
);

-- User metrics - tracks individual user engagement
CREATE TABLE IF NOT EXISTS `chatbot_user_metrics` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `dealership_id` INT,
  `total_conversations` INT DEFAULT 0,
  `total_messages` INT DEFAULT 0,
  `avg_satisfaction` DECIMAL(4, 2),
  `preferred_language` VARCHAR(8),
  `last_conversation_at` TIMESTAMP NULL,
  `first_seen_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_dealership` (`user_id`, `dealership_id`),
  INDEX `idx_dealership` (`dealership_id`)
);

-- Intent analytics - tracks which intents are most common
CREATE TABLE IF NOT EXISTS `chatbot_intent_analytics` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `dealership_id` INT,
  `intent` VARCHAR(64) NOT NULL,
  `date` DATE NOT NULL,
  `count` INT DEFAULT 0,
  `avg_sentiment` DECIMAL(4, 2),
  `avg_resolution_time_seconds` INT,
  `escalation_rate` DECIMAL(4, 2),
  `satisfaction_score` DECIMAL(4, 2),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_dealership_intent_date` (`dealership_id`, `intent`, `date`),
  INDEX `idx_dealership_date` (`dealership_id`, `date`)
);

-- Language analytics - tracks language usage
CREATE TABLE IF NOT EXISTS `chatbot_language_analytics` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `dealership_id` INT,
  `language` VARCHAR(8) NOT NULL,
  `date` DATE NOT NULL,
  `conversation_count` INT DEFAULT 0,
  `message_count` INT DEFAULT 0,
  `avg_sentiment` DECIMAL(4, 2),
  `avg_satisfaction` DECIMAL(4, 2),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_dealership_language_date` (`dealership_id`, `language`, `date`),
  INDEX `idx_dealership_date` (`dealership_id`, `date`)
);

-- Response time analytics - tracks performance metrics
CREATE TABLE IF NOT EXISTS `chatbot_response_analytics` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `dealership_id` INT,
  `date` DATE NOT NULL,
  `avg_response_time_ms` INT,
  `p50_response_time_ms` INT,
  `p95_response_time_ms` INT,
  `p99_response_time_ms` INT,
  `max_response_time_ms` INT,
  `min_response_time_ms` INT,
  `total_messages` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_dealership_date` (`dealership_id`, `date`),
  INDEX `idx_dealership_date` (`dealership_id`, `date`)
);

-- Hourly analytics - tracks peak hours and patterns
CREATE TABLE IF NOT EXISTS `chatbot_hourly_analytics` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `dealership_id` INT,
  `date` DATE NOT NULL,
  `hour` INT NOT NULL,
  `conversation_count` INT DEFAULT 0,
  `message_count` INT DEFAULT 0,
  `avg_sentiment` DECIMAL(4, 2),
  `escalation_count` INT DEFAULT 0,
  `avg_satisfaction` DECIMAL(4, 2),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_dealership_date_hour` (`dealership_id`, `date`, `hour`),
  INDEX `idx_dealership_date` (`dealership_id`, `date`)
);
