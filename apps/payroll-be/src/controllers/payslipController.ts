// src/controllers/payslipController.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import payslipService from '../services/payslipService';
import { User, Payslip } from '@prisma/client'; // Import User dan Payslip dari Prisma

// Perhatikan PayslipDetail di frontend memiliki struktur berbeda (misalnya, userName, overtime)
// Kita harus mengkonversi data dari Prisma.Payslip ke PayslipDetail yang diharapkan frontend
type PayslipWithUser = Payslip & { user: User }; // Tipe bantuan

const payslipController = {
    // Endpoint untuk karyawan sendiri: /me/payslips
    async getMyPayslips(request: FastifyRequest, reply: FastifyReply) {
        try {
            const userId = request.user.id; // Ambil userId dari JWT payload
            if (!userId) {
                return reply.status(401).send({ message: 'User ID not found in token.' });
            }

            const payslips: PayslipWithUser[] = await payslipService.getPayslipsForUser(userId);

            // Konversi Payslip dari Prisma ke format PayslipDetail frontend
            const payslipsResponse = payslips.map(ps => ({
                id: ps.id,
                userName: ps.user.name,
                period: ps.period.toISOString().substring(0, 10), // YYYY-MM-DD
                grossSalary: ps.grossSalary.toNumber(),
                totalAllowances: ps.totalAllowances.toNumber(),
                overtime: ps.overtime.toNumber(), // Pastikan ini ada di model Prisma
                totalDeductions: ps.totalDeductions.toNumber(),
                netSalary: ps.netSalary.toNumber(),
                taxAmount: ps.taxAmount.toNumber(),
                bpjsKesehatanAmount: ps.bpjsKesehatanAmount.toNumber(),
                bpjsKetenagakerjaanAmount: ps.bpjsKetenagakerjaanAmount.toNumber(),
                status: ps.status,
                details: ps.details,
                nik: ps.user.username, // Asumsi username sebagai NIK
                position: ps.user.position,
                department: ps.user.department,
            }));

            return reply.send(payslipsResponse);
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({ message: 'Error retrieving my payslips.' });
        }
    },

    // Endpoint untuk HR/Finance melihat semua: /payslips
    async getAllPayslips(request: FastifyRequest, reply: FastifyReply) {
        try {
            const payslips: PayslipWithUser[] = await payslipService.getAllPayslips();

            const payslipsResponse = payslips.map(ps => ({
                id: ps.id,
                userName: ps.user.name,
                period: ps.period.toISOString().substring(0, 10),
                grossSalary: ps.grossSalary.toNumber(),
                totalAllowances: ps.totalAllowances.toNumber(),
                overtime: ps.overtime.toNumber(),
                totalDeductions: ps.totalDeductions.toNumber(),
                netSalary: ps.netSalary.toNumber(),
                taxAmount: ps.taxAmount.toNumber(),
                bpjsKesehatanAmount: ps.bpjsKesehatanAmount.toNumber(),
                bpjsKetenagakerjaanAmount: ps.bpjsKetenagakerjaanAmount.toNumber(),
                status: ps.status,
                details: ps.details,
                nik: ps.user.username,
                position: ps.user.position,
                department: ps.user.department,
            }));

            return reply.send(payslipsResponse);
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({ message: 'Error retrieving all payslips.' });
        }
    },

    // Endpoint untuk mengunduh PDF: /payslips/:id/download-pdf
    async downloadPayslipPdf(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const payslipId = parseInt(request.params.id);
            const payslip = await payslipService.getPayslipById(payslipId);

            if (!payslip) {
                return reply.status(404).send({ message: 'Payslip not found.' });
            }

            // Otorisasi: Pastikan user hanya bisa mendownload payslip miliknya sendiri
            // kecuali jika dia HR/Finance
            const userRoles = request.user.roles;
            const isHRorFinance = userRoles.includes('Staff HR') || userRoles.includes('Manager HR') || userRoles.includes('Staff Finance');

            if (!isHRorFinance && request.user.id !== payslip.userId) {
                return reply.status(403).send({ message: 'Forbidden: You can only download your own payslips.' });
            }

            const pdfBuffer = await payslipService.generatePayslipPdf(payslip as PayslipWithUser); // Cast karena generatePayslipPdf butuh user di-include

            reply.header('Content-Type', 'application/pdf');
            reply.header('Content-Disposition', `attachment; filename="slip_gaji_${payslip.user.name}_${new Date(payslip.period).getFullYear()}_${new Date(payslip.period).getMonth() + 1}.pdf"`);
            return reply.send(pdfBuffer);
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({ message: 'Error generating or downloading payslip PDF.' });
        }
    },
};

export default payslipController;