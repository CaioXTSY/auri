-- Remove semester from classes; class period is represented only by year now.

ALTER TABLE `classes` DROP COLUMN `semester`;
