-- Per-dealership assistant display name (default Nala when null).
ALTER TABLE dealerships
  ADD COLUMN agentDisplayName VARCHAR(64) NULL;

-- Optional group key for multi-branch readiness (branches stay separate dealerships).
ALTER TABLE dealerships
  ADD COLUMN groupKey VARCHAR(64) NULL;

-- WhatsApp conversation marketing/opt-out flag (STOP / unsubscribe).
ALTER TABLE whatsapp_conversations
  ADD COLUMN optedOutAt TIMESTAMP NULL;
