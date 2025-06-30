// src/controllers/payrollController.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import payrollService from '../services/payrollService'; // Akan dibuat

interface StartPayrollBody {
    payrollPeriod: string; // ISO date string yyyy-MM-01
    paymentDate: string; // ISO date string yyyy-MM-dd
}

const payrollController = {
    async getPayrollStatus(request: FastifyRequest, reply: FastifyReply) {
        try {
            const status = await payrollService.getCurrentPayrollStatus();
            return reply.send(status);
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({ message: 'Error retrieving payroll status' });
        }
    },

    async startPayrollProcess(request: FastifyRequest<{ Body: StartPayrollBody }>, reply: FastifyReply) {
        const { payrollPeriod, paymentDate } = request.body;

        // Validasi dasar input tanggal
        if (!payrollPeriod || !paymentDate || isNaN(new Date(payrollPeriod).getTime()) || isNaN(new Date(paymentDate).getTime())) {
            return reply.status(400).send({ message: 'Invalid payrollPeriod or paymentDate format. Use YYYY-MM-DD.' });
        }

        try {
            // Dapatkan ID pengguna yang memulai proses
            const userId = request.user.id; // Asumsi userId tersedia dari JWT payload
            if (!userId) {
                return reply.status(401).send({ message: 'User not authenticated.' });
            }

            const result = await payrollService.initiatePayrollProcess(
                new Date(payrollPeriod),
                new Date(paymentDate),
                userId
            );
            return reply.status(202).send(result); // 202 Accepted karena prosesnya asinkron
        } catch (error: any) {
            request.log.error(error);
            if (error.message.includes("already exists for this period")) { // Contoh penanganan error spesifik
                return reply.status(409).send({ message: error.message });
            }
            return reply.status(500).send({ message: 'Error starting payroll process' });
        }
    },
    async getPayslipsForApproval(request: FastifyRequest, reply: FastifyReply) {
        try {
            const payslips = await payrollService.getPayslipsForApproval();
            const formattedPayslips = payslips.map(ps => ({
                id: ps.id,
                employee: ps.userId,
                amount: ps.netSalary.toNumber(),
                department: '-',
                status: ps.status.toLowerCase() as 'pending' | 'approved' | 'rejected' | 'processed',
                period: ps.period.toISOString().substring(0, 7),
                grossSalary: ps.grossSalary.toNumber(),
                totalAllowances: ps.totalAllowances.toNumber(),
                overtime: ps.overtime?.toNumber() || 0,
                totalDeductions: ps.totalDeductions.toNumber(),
                taxAmount: ps.taxAmount.toNumber(),
                bpjsKesehatanAmount: ps.bpjsKesehatanAmount.toNumber(),
                bpjsKetenagakerjaanAmount: ps.bpjsKetenagakerjaanAmount.toNumber(),
                details: ps.details,
            }));
            return reply.send(formattedPayslips);
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({ message: 'Error retrieving payslips for approval.' });
        }
    },

    async approvePayslip(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const payslipId = parseInt(request.params.id);
        const approverUserId = request.user.id; // ID Manager HR yang menyetujui

        try {
            if (!approverUserId) {
                return reply.status(401).send({ message: 'User ID not found in token.' });
            }
            const updatedPayslip = await payrollService.approvePayslip(payslipId, approverUserId);
            return reply.send({ message: 'Payslip approved successfully.', payslipId: updatedPayslip.id });
        } catch (error: any) {
            request.log.error(error);
            if (error.message.includes("Payslip not found")) {
                return reply.status(404).send({ message: error.message });
            }
            return reply.status(500).send({ message: error.message || 'Error approving payslip.' });
        }
    },

    async rejectPayslip(request: FastifyRequest<{ Params: { id: string }, Body: { reason?: string } }>, reply: FastifyReply) {
        const payslipId = parseInt(request.params.id);
        const rejecterUserId = request.user.id;
        const { reason } = request.body;

        try {
            if (!rejecterUserId) {
                return reply.status(401).send({ message: 'User ID not found in token.' });
            }
            const updatedPayslip = await payrollService.rejectPayslip(payslipId, rejecterUserId, reason);
            return reply.send({ message: 'Payslip rejected successfully.', payslipId: updatedPayslip.id });
        } catch (error: any) {
            request.log.error(error);
            if (error.message.includes("Payslip not found")) {
                return reply.status(404).send({ message: error.message });
            }
            return reply.status(500).send({ message: error.message || 'Error rejecting payslip.' });
        }
    },
};


export default payrollController;