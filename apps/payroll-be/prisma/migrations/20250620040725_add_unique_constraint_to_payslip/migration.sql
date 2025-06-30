/*
  Warnings:

  - A unique constraint covering the columns `[userId,period,payrollProcessId]` on the table `Payslip` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Payslip_userId_period_payrollProcessId_key` ON `Payslip`(`userId`, `period`, `payrollProcessId`);
