-- Optional Meta phone_number_id on onboarding applications (paste once, or webhook stash before provision).
ALTER TABLE onboarding_submissions
  ADD COLUMN whatsappPhoneNumberId VARCHAR(64) NULL;
