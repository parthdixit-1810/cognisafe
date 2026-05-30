-- AlterTable: add url, notes, type to Password
ALTER TABLE `Password`
  ADD COLUMN `url`   VARCHAR(512) NULL,
  ADD COLUMN `notes` TEXT         NULL,
  ADD COLUMN `type`  VARCHAR(191) NOT NULL DEFAULT 'password';
