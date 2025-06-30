// src/services/payrollService.ts
import { PrismaClient, User, PayrollProcess, Payslip, Prisma } from '@prisma/client';
import activityLogService from './activityLogService'; // Pastikan path ini sesuai dengan lokasi file service Anda

const prisma = new PrismaClient();

const payrollService = {
    async getCurrentPayrollStatus() {
        // Dapatkan proses penggajian terbaru yang relevan
        const latestProcess = await prisma.payrollProcess.findFirst({
            orderBy: { createdAt: 'desc' },
        });

        if (latestProcess) {
            return {
                payrollPeriod: latestProcess.payrollPeriod.toISOString().substring(0, 7), // "YYYY-MM"
                paymentDate: latestProcess.paymentDate.toISOString().substring(0, 10), // "YYYY-MM-DD"
                totalEmployees: latestProcess.totalEmployees,
                processed: latestProcess.processedCount,
                pending: latestProcess.pendingCount,
                status: latestProcess.status, // Menambahkan status proses
            };
        } else {
            // Jika belum ada proses, ambil total karyawan dari database
            const totalUsers = await prisma.user.count({ where: { status: "active" } });
            return {
                payrollPeriod: null,
                paymentDate: null,
                totalEmployees: totalUsers,
                processed: 0,
                pending: totalUsers,
                status: "No Process Yet",
            };
        }
    },

    async initiatePayrollProcess(payrollPeriod: Date, paymentDate: Date, startedByUserId: number) {
        // Cek apakah sudah ada proses untuk periode yang sama yang masih Pending/Processing
        const existingProcess = await prisma.payrollProcess.findFirst({
            where: {
                payrollPeriod: payrollPeriod,
                status: {
                    in: ["Pending", "Processing"]
                }
            }
        });

        if (existingProcess) {
            throw new Error(`A payroll process for ${payrollPeriod.toISOString().substring(0, 7)} already exists for this period and is in ${existingProcess.status} status.`);
        }

        const activeUsers = await prisma.user.findMany({
            where: { status: "active" },
            select: { id: true }
        });
        const totalActiveUsers = activeUsers.length;

        // Buat entri PayrollProcess baru
        const newPayrollProcess = await prisma.payrollProcess.create({
            data: {
                payrollPeriod: payrollPeriod,
                paymentDate: paymentDate,
                totalEmployees: totalActiveUsers,
                processedCount: 0,
                pendingCount: totalActiveUsers,
                status: "Pending", // Status awal
                startedByUserId: startedByUserId,
            },
        });

        // Buat entri Payslip awal untuk setiap karyawan
        const payslipCreations = activeUsers.map((user: any) => ({
            userId: user.id,
            payrollProcessId: newPayrollProcess.id,
            period: payrollPeriod,
            grossSalary: 0, // Nilai awal, akan diisi nanti oleh proses perhitungan
            totalAllowances: 0,
            totalDeductions: 0,
            netSalary: 0,
            taxAmount: 0,
            bpjsKesehatanAmount: 0,
            bpjsKetenagakerjaanAmount: 0,
            status: "Pending", // Status awal slip gaji
        }));

        await prisma.payslip.createMany({
            data: payslipCreations,
            skipDuplicates: true // Untuk berjaga-jaga
        });


        return {
            message: 'Payroll process initiated successfully.',
            processId: newPayrollProcess.id,
            payrollPeriod: newPayrollProcess.payrollPeriod.toISOString().substring(0, 7),
            paymentDate: newPayrollProcess.paymentDate.toISOString().substring(0, 10),
            totalEmployees: newPayrollProcess.totalEmployees,
            processed: newPayrollProcess.processedCount,
            pending: newPayrollProcess.pendingCount,
            status: newPayrollProcess.status,
        };
    },

    async updatePayslipStatus(payslipId: number, newStatus: string, calculatedData: any) {
        return await prisma.payslip.update({
            where: { id: payslipId },
            data: {
                status: newStatus,
                grossSalary: calculatedData.grossSalary,
                totalAllowances: calculatedData.totalAllowances,
                totalDeductions: calculatedData.totalDeductions,
                netSalary: calculatedData.netSalary,
                taxAmount: calculatedData.taxAmount,
                bpjsKesehatanAmount: calculatedData.bpjsKesehatanAmount,
                bpjsKetenagakerjaanAmount: calculatedData.bpjsKetenagakerjaanAmount,
                details: calculatedData.details, // Menyimpan detail komponen
            },
        });
    },

    async updatePayrollProcessCounts(processId: number) {
        const processedCount = await prisma.payslip.count({
            where: {
                payrollProcessId: processId,
                status: { in: ["Processed", "Paid"] }
            }
        });

        const pendingCount = await prisma.payslip.count({
            where: {
                payrollProcessId: processId,
                status: "Pending"
            }
        });

        const completedCount = await prisma.payslip.count({
            where: {
                payrollProcessId: processId,
                status: { not: "Pending" }
            }
        });

        const totalEmployeesInProcess = await prisma.payslip.count({
            where: { payrollProcessId: processId }
        });

        let processStatus = "Processing";
        if (processedCount === totalEmployeesInProcess && totalEmployeesInProcess > 0) {
            processStatus = "Completed";
        } else if (processedCount === 0 && pendingCount === totalEmployeesInProcess && totalEmployeesInProcess > 0) {
            processStatus = "Pending";
        } else if (totalEmployeesInProcess === 0) {
            processStatus = "No Employees"; // Case jika tidak ada karyawan aktif saat proses dimulai
        }


        await prisma.payrollProcess.update({
            where: { id: processId },
            data: {
                processedCount: processedCount,
                pendingCount: pendingCount,
                status: processStatus,
            },
        });
    },
    async getPayslipsForApproval(): Promise<Payslip[]> {
        return await prisma.payslip.findMany({
            where: {
                // Asumsi status yang perlu persetujuan Manager HR adalah "Processed" (setelah Staff HR proses)
                // dan belum ada status persetujuan final (Approved/Rejected)
                status: "Processed" // Atau "Waiting Approval" jika Anda punya status spesifik ini
            },
            include: {
                user: {
                    select: { name: true, department: true, position: true, email: true }, // Ambil info karyawan
                },
                payrollProcess: {
                    select: { payrollPeriod: true } // Ambil info periode dari proses payroll
                }
            },
            orderBy: { createdAt: 'asc' }, // Urutkan dari yang paling lama
        });
    },

    async approvePayslip(payslipId: number, approverUserId: number): Promise<Payslip> {
        const payslip = await prisma.payslip.findUnique({ where: { id: payslipId } });
        if (!payslip) {
            throw new Error("Payslip not found.");
        }
        if (payslip.status !== 'Processed') { // Pastikan hanya bisa menyetujui yang statusnya 'Processed'
            throw new Error(`Payslip is not in 'Processed' status. Current status: ${payslip.status}`);
        }

        const updatedPayslip = await prisma.payslip.update({
            where: { id: payslipId },
            data: { status: 'Approved' }, // Ubah status menjadi Approved
            include: { user: true, payrollProcess: true }
        });

        // Catat aktivitas di log
        await activityLogService.logActivity(
            `Payslip for ${updatedPayslip.user.name} for ${updatedPayslip.period.toISOString().substring(0, 7)} approved.`,
            'Payroll Approval',
            approverUserId
        );

        // TODO: Perbarui counter processed/pending di PayrollProcess jika diperlukan
        // await this.updatePayrollProcessCounts(updatedPayslip.payrollProcessId);

        return updatedPayslip;
    },

    async rejectPayslip(payslipId: number, rejecterUserId: number, reason?: string): Promise<Payslip> {
        const payslip = await prisma.payslip.findUnique({ where: { id: payslipId } });
        if (!payslip) {
            throw new Error("Payslip not found.");
        }
        if (payslip.status !== 'Processed') {
            throw new Error(`Payslip is not in 'Processed' status. Current status: ${payslip.status}`);
        }

        const updatedPayslip = await prisma.payslip.update({
            where: { id: payslipId },
            data: {
                status: 'Rejected', // Ubah status menjadi Rejected
                details: { // Simpan alasan penolakan di field details (JSON)
                    ...((payslip.details as Prisma.JsonObject) || {}),
                    rejectionReason: reason || 'Rejected by Manager HR',
                    rejectedAt: new Date().toISOString(),
                    rejectedBy: rejecterUserId,
                }
            },
            include: { user: true, payrollProcess: true }
        });

        // Catat aktivitas di log
        await activityLogService.logActivity(
            `Payslip for ${updatedPayslip.user.name} for ${updatedPayslip.period.toISOString().substring(0, 7)} rejected. Reason: ${reason || 'No reason provided'}.`,
            'Payroll Approval',
            rejecterUserId
        );

        // TODO: Perbarui counter processed/pending di PayrollProcess jika diperlukan
        // await this.updatePayrollProcessCounts(updatedPayslip.payrollProcessId);

        return updatedPayslip;
    },
};

export default payrollService;