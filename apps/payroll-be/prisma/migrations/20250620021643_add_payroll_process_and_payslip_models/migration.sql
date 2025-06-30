-- CreateTable
CREATE TABLE `PayrollProcess` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `payrollPeriod` DATETIME(3) NOT NULL,
    `paymentDate` DATETIME(3) NOT NULL,
    `totalEmployees` INTEGER NOT NULL DEFAULT 0,
    `processedCount` INTEGER NOT NULL DEFAULT 0,
    `pendingCount` INTEGER NOT NULL DEFAULT 0,
    `startedByUserId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payslip` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `payrollProcessId` INTEGER NOT NULL,
    `period` DATETIME(3) NOT NULL,
    `grossSalary` DECIMAL(65, 30) NOT NULL,
    `totalAllowances` DECIMAL(65, 30) NOT NULL,
    `totalDeductions` DECIMAL(65, 30) NOT NULL,
    `netSalary` DECIMAL(65, 30) NOT NULL,
    `taxAmount` DECIMAL(65, 30) NOT NULL,
    `bpjsKesehatanAmount` DECIMAL(65, 30) NOT NULL,
    `bpjsKetenagakerjaanAmount` DECIMAL(65, 30) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Pending',
    `details` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PayrollProcess` ADD CONSTRAINT `PayrollProcess_startedByUserId_fkey` FOREIGN KEY (`startedByUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payslip` ADD CONSTRAINT `Payslip_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payslip` ADD CONSTRAINT `Payslip_payrollProcessId_fkey` FOREIGN KEY (`payrollProcessId`) REFERENCES `PayrollProcess`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
