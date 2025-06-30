// src/routes/payslipRoutes.ts
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import payslipController from '../controllers/payslipController';

async function payslipRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    fastify.addHook('preHandler', fastify.authenticate);

    const hasRole = (request: any, requiredRoles: string[]) => {
        return requiredRoles.some(role => request.user.roles.includes(role));
    };

    // Endpoint untuk Karyawan melihat slip gajinya sendiri
    fastify.get('/me/payslips', {
        // Tidak perlu preHandler role karena sudah dilindungi oleh authenticate dan getMyPayslips akan filter berdasarkan userId dari token
        handler: payslipController.getMyPayslips,
    });

    // Endpoint untuk HR/Finance melihat semua slip gaji
    fastify.get('/payslips', {
        preHandler: async (request, reply) => {
            if (!hasRole(request, ['Staff HR', 'Manager HR', 'Staff Finance'])) {
                return reply.status(403).send({ message: 'Forbidden: You do not have access to view all payslips.' });
            }
        },
        handler: payslipController.getAllPayslips,
    });

    // Endpoint untuk mengunduh PDF slip gaji
    fastify.get('/payslips/:id/download-pdf', {
        // Otorisasi dilakukan di controller untuk handle "milik sendiri" vs "semua"
        handler: payslipController.downloadPayslipPdf,
    });
}

export default payslipRoutes;