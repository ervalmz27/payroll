// src/routes/dashboardRoutes.ts
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import dashboardController from '../controllers/dashboardController';

async function dashboardRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    fastify.addHook('preHandler', fastify.authenticate);

    const hasRole = (request: any, requiredRoles: string[]) => {
        return requiredRoles.some(role => request.user.roles.includes(role));
    };

    // Endpoint untuk ringkasan dashboard HR
    fastify.get('/dashboard/hr-summary', {
        preHandler: async (request, reply) => {
            if (!hasRole(request, ['Staff HR', 'Manager HR'])) {
                return reply.status(403).send({ message: 'Forbidden: You do not have access to this dashboard summary.' });
            }
        },
        handler: dashboardController.getHRDashboardSummary
    });

    // Endpoint untuk ringkasan dashboard Finance
    fastify.get('/dashboard/finance-summary', {
        preHandler: async (request, reply) => {
            if (!hasRole(request, ['Staff Finance', 'Manager HR'])) { // Manager HR juga bisa melihat
                return reply.status(403).send({ message: 'Forbidden: You do not have access to this dashboard summary.' });
            }
        },
        handler: dashboardController.getFinanceDashboardSummary
    });

    // Endpoint untuk ringkasan dashboard Karyawan (khusus user yang login)
    fastify.get('/dashboard/employee-summary', {
        preHandler: async (request, reply) => {
            if (!hasRole(request, ['Karyawan'])) { // Hanya Karyawan yang bisa melihat ini
                return reply.status(403).send({ message: 'Forbidden: You do not have access to this dashboard summary.' });
            }
        },
        handler: dashboardController.getEmployeeDashboardSummary
    });

    // Endpoint untuk aktivitas terbaru (bisa diakses HR/Manager)
    fastify.get('/dashboard/recent-activities', {
        preHandler: async (request, reply) => {
            if (!hasRole(request, ['Staff HR', 'Manager HR'])) {
                return reply.status(403).send({ message: 'Forbidden: You do not have access to this information.' });
            }
        },
        handler: dashboardController.getRecentActivities
    });
}

export default dashboardRoutes;