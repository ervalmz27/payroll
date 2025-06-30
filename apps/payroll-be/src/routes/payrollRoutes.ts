import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import payrollController from '../controllers/payrollController';

async function payrollRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    fastify.addHook('preHandler', fastify.authenticate);
    const hasRole = (request: any, requiredRoles: string[]) => {
        return requiredRoles.some(role => request.user.roles.includes(role));
    };

    fastify.get('/payroll/status', {
        preHandler: async (request, reply) => {
            if (!hasRole(request, ['Staff HR', 'Manager HR'])) {
                return reply.status(403).send({ message: 'Forbidden: Only HR staff can view payroll status.' });
            }
        },
        handler: payrollController.getPayrollStatus
    });

    fastify.get('/payroll/for-approval', {
        preHandler: async (request, reply) => {
            if (!hasRole(request, ['Manager HR'])) {
                return reply.status(403).send({ message: 'Forbidden: Only Manager HR can view payslips for approval.' });
            }
        },
        handler: payrollController.getPayslipsForApproval,
    });
    fastify.put('/payroll/:id/approve', {
        preHandler: async (request, reply) => {
            if (!hasRole(request, ['Manager HR'])) {
                return reply.status(403).send({ message: 'Forbidden: Only Manager HR can approve payslips.' });
            }
        },
        handler: payrollController.approvePayslip,
    });

    fastify.put('/payroll/:id/reject', {
        preHandler: async (request, reply) => {
            if (!hasRole(request, ['Manager HR'])) {
                return reply.status(403).send({ message: 'Forbidden: Only Manager HR can reject payslips.' });
            }
        },
        handler: payrollController.rejectPayslip,
    });

    fastify.post('/payroll/start-process', {
        preHandler: async (request, reply) => {
            if (!hasRole(request, ['Staff HR'])) {
                return reply.status(403).send({ message: 'Forbidden: Only Staff HR can start payroll process.' });
            }
        },
        handler: payrollController.startPayrollProcess
    });
}

export default payrollRoutes;