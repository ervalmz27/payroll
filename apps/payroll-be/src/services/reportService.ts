// src/services/reportService.ts
import { PrismaClient, Payslip, User } from '@prisma/client';

const prisma = new PrismaClient();

interface ReportSummary {
    period: string; // YYYY-MM
    totalGrossSalary: number;
    totalNetSalary: number;
    totalTax: number;
    totalBPJSKes: number;
    totalBPJSKet: number;
    employeeCount: number;
}

interface Pph21ReportEntry {
    employeeName: string;
    employeeEmail: string;
    npwp?: string; // Asumsi ada di model User atau perlu ditambahkan
    period: string; // YYYY-MM
    grossSalary: number;
    taxAmount: number;
}

const reportService = {
    async getMonthlyPayrollSummary(startDate: Date, endDate: Date): Promise<ReportSummary[]> {
        const summary = await prisma.payslip.groupBy({
            by: ['period'],
            where: {
                period: {
                    gte: startDate,
                    lte: endDate,
                },
                status: { in: ['Processed', 'Paid'] }, // Hanya laporan yang sudah diproses/dibayar
            },
            _sum: {
                grossSalary: true,
                netSalary: true,
                taxAmount: true,
                bpjsKesehatanAmount: true,
                bpjsKetenagakerjaanAmount: true,
            },
            _count: {
                userId: true, // Menghitung jumlah karyawan yang memiliki payslip di periode tersebut
            },
            orderBy: {
                period: 'asc',
            },
        });

        return summary.map((s) => ({
            period: s.period.toISOString().substring(0, 7), // Format YYYY-MM
            totalGrossSalary: s._sum.grossSalary?.toNumber() || 0,
            totalNetSalary: s._sum.netSalary?.toNumber() || 0,
            totalTax: s._sum.taxAmount?.toNumber() || 0,
            totalBPJSKes: s._sum.bpjsKesehatanAmount?.toNumber() || 0,
            totalBPJSKet: s._sum.bpjsKetenagakerjaanAmount?.toNumber() || 0,
            employeeCount: s._count.userId,
        }));
    },

    async getPph21Report(startDate: Date, endDate: Date): Promise<Pph21ReportEntry[]> {
        const payslips = await prisma.payslip.findMany({
            where: {
                period: {
                    gte: startDate,
                    lte: endDate,
                },
                taxAmount: {
                    gt: 0, // Hanya yang ada pajaknya
                },
                status: { in: ['Processed', 'Paid'] },
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        // npwp: true, // Asumsi NPWP ada di model User, jika tidak, perlu ditambahkan
                    },
                },
            },
            orderBy: {
                period: 'asc',
            },
        });

        return payslips.map((ps) => ({
            employeeName: ps.user.name,
            employeeEmail: ps.user.email,
            npwp: (ps.user as any).npwp || '-', // Jika NPWP belum ada di model User
            period: ps.period.toISOString().substring(0, 7),
            grossSalary: ps.grossSalary.toNumber(),
            taxAmount: ps.taxAmount.toNumber(),
        }));
    },

    // TODO: Tambahkan fungsi untuk laporan BPJS, Laporan Kepatuhan, dll.
};

export default reportService;