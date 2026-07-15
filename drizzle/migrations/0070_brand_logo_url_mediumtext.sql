-- Widen brandLogoUrl to MEDIUMTEXT so uploaded logos can fall back to a
-- base64 data: URL when no S3/R2 bucket is configured (same pattern as
-- vehicles.primaryPhotoUrl). VARCHAR(500) was too small for a real image.
ALTER TABLE dealerships
  MODIFY COLUMN brandLogoUrl MEDIUMTEXT NULL;
