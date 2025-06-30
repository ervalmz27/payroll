// src/routes/reportRoutes.ts
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import reportController from '../controllers/reportController';

async function reportRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    fastify.addHook('preHandler', fastify.authenticate);

    const hasRole = (request: any, requiredRoles: string[]) => {
        return requiredRoles.some(role => request.user.roles.includes(role));
    };

    // Endpoint untuk Laporan Ringkasan Gaji Bulanan
    fastify.get('/reports/monthly-payroll-summary', {
        preHandler: async (request, reply) => {
            if (!hasRole(request, ['Staff HR', 'Manager HR', 'Staff Finance'])) {
                return reply.status(403).send({ message: 'Forbidden: You do not have access to this report.' });
            }
        },
        handler: reportController.getMonthlyPayrollSummary,
    });

    // Endpoint untuk Laporan PPh 21
    fastify.get('/reports/pph21', {
        preHandler: async (request, reply) => {
            if (!hasRole(request, ['Staff HR', 'Manager HR', 'Staff Finance'])) {
                return reply.status(403).send({ message: 'Forbidden: You do not have access to this report.' });
            }
        },
        handler: reportController.getPph21Report,
    });

    // TODO: Tambahkan rute untuk laporan lain
}

export default reportRoutes;