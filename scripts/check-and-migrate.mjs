import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection({
  uri: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
});

// Check and add showroomTheme
const [cols] = await conn.execute("SHOW COLUMNS FROM dealerships LIKE 'showroomTheme'");
if (cols.length === 0) {
  console.log("Adding showroomTheme column...");
  await conn.execute("ALTER TABLE `dealerships` ADD `showroomTheme` varchar(32) DEFAULT 'futuristic'");
  console.log("✅ showroomTheme column added");
} else {
  console.log("✅ showroomTheme column already exists:", cols[0]);
}

// Check compliance_inquiries table
const [tables] = await conn.execute("SHOW TABLES LIKE 'compliance_inquiries'");
if (tables.length === 0) {
  console.log("Creating compliance_inquiries table...");
  await conn.execute(`CREATE TABLE IF NOT EXISTS compliance_inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mailbox ENUM('privacy', 'legal', 'hello', 'other') NOT NULL DEFAULT 'other',
    source ENUM('web_form', 'resend_inbound', 'manual') NOT NULL DEFAULT 'web_form',
    senderName VARCHAR(255),
    senderEmail VARCHAR(320) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('new', 'read', 'replied', 'archived') NOT NULL DEFAULT 'new',
    externalId VARCHAR(255),
    metadata JSON,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    readAt TIMESTAMP NULL,
    INDEX idx_compliance_status (status),
    INDEX idx_compliance_mailbox (mailbox),
    INDEX idx_compliance_created (createdAt)
  )`);
  console.log("✅ compliance_inquiries table created");
} else {
  console.log("✅ compliance_inquiries table already exists");
}

await conn.end();
console.log("Migration complete.");
