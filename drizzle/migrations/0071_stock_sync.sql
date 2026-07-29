-- Live stock sync: per-vehicle lastSyncedAt + dealership feed settings.
ALTER TABLE vehicles
  ADD COLUMN lastSyncedAt TIMESTAMP NULL;

ALTER TABLE dealerships
  ADD COLUMN stockSyncFeedUrl VARCHAR(500) NULL;

ALTER TABLE dealerships
  ADD COLUMN stockSyncEnabled TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE dealerships
  ADD COLUMN stockSyncMarkMissingAsSold TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE dealerships
  ADD COLUMN stockSyncSkipPhotoMirror TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE dealerships
  ADD COLUMN stockSyncLastAt TIMESTAMP NULL;

ALTER TABLE dealerships
  ADD COLUMN stockSyncLastResult JSON NULL;
