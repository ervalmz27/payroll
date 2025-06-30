// src/controllers/dashboardController.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import dashboardService from '../services/dashbordService';

const dashboardController = {
    async getHRDashboardSummary(request: FastifyRequest, reply: FastifyReply) {
        try {
            const summary = await dashboardService.getHRSummary();
            return reply.send(summary);
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({ message: 'Error retrieving HR dashboard summary' });
        }
    },

    async getFinanceDashboardSummary(request: FastifyRequest, reply: FastifyReply) {
        try {
            const summary = await dashboardService.getFinanceSummary();
            return reply.send(summary);
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({ message: 'Error retrieving Finance dashboard summary' });
        }
    },

    async getEmployeeDashboardSummary(request: FastifyRequest, reply: FastifyReply) {
        try {
            const userId = request.user.id; // Ambil userId dari JWT payload
            if (!userId) {
                return reply.status(401).send({ message: 'User ID not found in token.' });
            }
            const summary = await dashboardService.getEmployeeSummary(userId);
            return reply.send(summary);
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({ message: 'Error retrieving Employee dashboard summary' });
        }
    },

    async getRecentActivities(request: FastifyRequest, reply: FastifyReply) {
        try {
            const activities = await dashboardService.getRecentActivities(5);
            return reply.send(activities);
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({ message: 'Error retrieving recent activities' });
        }
    },
};

export default dashboardController;