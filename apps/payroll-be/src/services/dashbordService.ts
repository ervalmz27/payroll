// src/services/dashboardService.ts
import { PrismaClient, Prisma } from '@prisma/client';
import activityLogService from './activityLogService';

const prisma = new PrismaClient();

// Interfaces untuk data summary
interface HRSummary {
    totalEmployees: number;
    payrollThisMonth: number;
    pendingApproval: number;
    complianceRate: number;
}

interface FinanceSummary {
    payrollVerified: number;
    totalPayments: number;
    pendingPayment: number;
    taxCompliance: number;
}

interface EmployeeSummary {
    payrollThisMonth: number;
    workDays: number;
    overtimeHours: number;
    pph21Amount: number;
    // Tambahan lain jika perlu, misal latestPayslipId, annualGross
}

const dashboardService = {
    async getHRSummary(): Promise<HRSummary> {
        const totalEmployees = await prisma.user.count();

        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);

        const nextMonth = new Date(currentMonth);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const payrollThisMonthResult = await prisma.payslip.aggregate({
            _sum: { netSalary: true },
            where: {
                period: {
                    gte: currentMonth,
                    lt: nextMonth,
                },
                status: { in: ["Processed", "Paid"] }
            },
        });
        const payrollThisMonth = payrollThisMonthResult._sum.netSalary || new Prisma.Decimal(0);

        const pendingApprovalCount = await prisma.payslip.count({
            where: {
                status: "Pending Approval"
            },
        });

        const complianceRate = 98; // Ini harus diganti dengan logika perhitungan yang sebenarnya

        return {
            totalEmployees,
            payrollThisMonth: payrollThisMonth.toNumber(),
            pendingApproval: pendingApprovalCount,
            complianceRate,
        };
    },

    async getFinanceSummary(): Promise<FinanceSummary> {
        // TODO: Implementasi logika untuk Staff Finance dashboard summary
        // Contoh:
        const verifiedPayslipsCount = await prisma.payslip.count({
            where: { status: 'Verified by Finance' }
        });
        const totalPaymentsResult = await prisma.payslip.aggregate({
            _sum: { netSalary: true },
            where: { status: 'Paid' }
        });
        const pendingPaymentCount = await prisma.payslip.count({
            where: { status: 'Verified by Finance' } // Atau status lain yang menunjukkan siap bayar
        });
        // Tax Compliance bisa dari laporan atau data statis/hitung
        const taxComplianceRate = 100;

        return {
            payrollVerified: verifiedPayslipsCount,
            totalPayments: totalPaymentsResult._sum.netSalary?.toNumber() || 0,
            pendingPayment: pendingPaymentCount,
            taxCompliance: taxComplianceRate
        };
    },

    async getEmployeeSummary(userId: number): Promise<EmployeeSummary> {
        // Dapatkan bulan saat ini
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);

        const nextMonth = new Date(currentMonth);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        // Ambil payslip terbaru untuk bulan ini
        const latestPayslip = await prisma.payslip.findFirst({
            where: {
                userId: userId,
                period: {
                    gte: currentMonth,
                    lt: nextMonth,
                },
                status: { in: ["Processed", "Paid"] }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Hitung total jam kerja dan lembur (asumsi dari payslip.details atau tabel terpisah)
        // Ini adalah data mock/placeholder jika tidak ada di payslip.details
        const workDays = 22; // Asumsi tetap untuk demo
        const overtimeHours = latestPayslip?.overtime?.toNumber() && latestPayslip.grossSalary.toNumber() > 0 ? // Asumsi overtime dari total lembur dalam payslip
            Math.round((latestPayslip.overtime.toNumber() / (latestPayslip.grossSalary.toNumber() / workDays / 8))) // Estimasi jam lembur jika gaji per jam diketahui
            : 0;
        // Atau bisa disimpan langsung di tabel kehadiran.

        return {
            payrollThisMonth: latestPayslip?.netSalary?.toNumber() || 0,
            workDays: workDays, // Ini harus datang dari data kehadiran riil
            overtimeHours: overtimeHours, // Ini harus datang dari data kehadiran riil atau kalkulasi detail
            pph21Amount: latestPayslip?.taxAmount?.toNumber() || 0,
        };
    },

    async getRecentActivities(limit: number = 5): Promise<any[]> { // Replace 'any' with the correct type if available
        return await activityLogService.getRecentActivities(limit);
    },
};

export default dashboardService;