-- AlterTable: add customFields to Password
ALTER TABLE `Password` ADD COLUMN `customFields` JSON NULL;

-- CreateTable: PasswordHistory
CREATE TABLE `PasswordHistory` (
  `id`         INT NOT NULL AUTO_INCREMENT,
  `password`   VARCHAR(191) NOT NULL,
  `createdAt`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `passwordId` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `PasswordHistory_passwordId_fkey` (`passwordId`),
  CONSTRAINT `PasswordHistory_passwordId_fkey`
    FOREIGN KEY (`passwordId`) REFERENCES `Password` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
);
