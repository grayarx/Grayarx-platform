CREATE TABLE IF NOT EXISTS trade_in_invites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quoteId INT NOT NULL,
  dealershipId INT NOT NULL,
  dealershipName VARCHAR(255) NOT NULL,
  inviteMessage TEXT NOT NULL,
  indicativeOfferZar INT NULL,
  leadId INT NULL,
  smsSent INT NOT NULL DEFAULT 0,
  emailSent INT NOT NULL DEFAULT 0,
  whatsappSent INT NOT NULL DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_trade_in_invites_quote (quoteId)
);
