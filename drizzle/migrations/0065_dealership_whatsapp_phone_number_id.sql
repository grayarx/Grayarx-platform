-- Add whatsappPhoneNumberId to dealerships for multi-dealer WhatsApp routing.
-- When a dealer signs up and provides their Meta phone_number_id, store it here.
-- The webhook handler looks up this column to route messages to the right dealership.
ALTER TABLE dealerships
  ADD COLUMN whatsappPhoneNumberId VARCHAR(64) NULL;

CREATE INDEX idx_dealerships_whatsapp_phone
  ON dealerships (whatsappPhoneNumberId);
