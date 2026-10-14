ALTER TABLE `user_points` ADD COLUMN `idempotency_key` VARCHAR(64) NULL;
CREATE UNIQUE INDEX `user_points_idempotency_key_key` ON `user_points`(`idempotency_key`);
ALTER TABLE `missions` ADD COLUMN `daily_key` VARCHAR(10) NULL;
CREATE UNIQUE INDEX `missions_daily_key_key` ON `missions`(`daily_key`);
ALTER TABLE `mission_quizzes`
  ADD COLUMN `review_status` VARCHAR(20) NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN `reviewed_by_id` VARCHAR(191) NULL,
  ADD COLUMN `reviewed_at` DATETIME(3) NULL,
  ADD COLUMN `review_reason` TEXT NULL,
  ADD COLUMN `quality_warnings` JSON NULL;
ALTER TABLE `ai_generations`
  ADD COLUMN `requested_difficulty` VARCHAR(191) NULL,
  ADD COLUMN `returned_difficulty` VARCHAR(191) NULL,
  ADD COLUMN `status` VARCHAR(20) NULL,
  ADD COLUMN `call_audit` JSON NULL;
