-- Tier 3 retention: Google review link for ask-for-review drafts
ALTER TABLE dealerships
  ADD COLUMN googleReviewUrl VARCHAR(500) NULL;
