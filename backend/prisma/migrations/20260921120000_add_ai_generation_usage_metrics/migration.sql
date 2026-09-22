-- Aggregate usage for the OpenAI calls that produced an approved generation.
-- Existing audit records intentionally remain nullable for backwards compatibility.
ALTER TABLE `ai_generations`
  ADD COLUMN `model` VARCHAR(191) NULL,
  ADD COLUMN `input_tokens` INTEGER NULL,
  ADD COLUMN `output_tokens` INTEGER NULL,
  ADD COLUMN `total_tokens` INTEGER NULL,
  ADD COLUMN `generation_attempts` INTEGER NULL,
  ADD COLUMN `validation_calls` INTEGER NULL;
