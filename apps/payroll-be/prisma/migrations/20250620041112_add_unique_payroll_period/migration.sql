/*
  Warnings:

  - A unique constraint covering the columns `[payrollPeriod]` on the table `PayrollProcess` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `PayrollProcess` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'Pending';

-- CreateIndex
CREATE UNIQUE INDEX `PayrollProcess_payrollPeriod_key` ON `PayrollProcess`(`payrollPeriod`);
