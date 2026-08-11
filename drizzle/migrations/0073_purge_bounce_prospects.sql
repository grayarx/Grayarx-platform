-- One-shot marker table for irreversible data cleanups.
CREATE TABLE IF NOT EXISTS `_grayarx_one_shots` (
  `name` varchar(128) NOT NULL,
  `appliedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`name`)
);
