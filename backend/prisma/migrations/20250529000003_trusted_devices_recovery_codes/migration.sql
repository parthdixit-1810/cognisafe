-- CreateTable TrustedDevice
CREATE TABLE `TrustedDevice` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `tokenHash`  VARCHAR(191) NOT NULL,
  `deviceName` VARCHAR(191) NULL,
  `createdAt`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expiresAt`  DATETIME(3)  NOT NULL,
  `userId`     INT          NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `TrustedDevice_tokenHash_key` (`tokenHash`),
  INDEX `TrustedDevice_userId_fkey` (`userId`),
  CONSTRAINT `TrustedDevice_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable RecoveryCode
CREATE TABLE `RecoveryCode` (
  `id`        INT          NOT NULL AUTO_INCREMENT,
  `codeHash`  VARCHAR(191) NOT NULL,
  `usedAt`    DATETIME(3)  NULL,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `userId`    INT          NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `RecoveryCode_userId_fkey` (`userId`),
  CONSTRAINT `RecoveryCode_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
