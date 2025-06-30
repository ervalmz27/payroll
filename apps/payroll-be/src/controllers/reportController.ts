// src/controllers/reportController.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import reportService from '../services/reportService';

// Interfaces for query parameters
interface ReportQueryParams {
    startDate: string; // ISO date string (YYYY-MM-DD)
    endDate: string;   // ISO date string (YYYY-MM-DD)
}

const reportController = {
    async getMonthlyPayrollSummary(
        request: FastifyRequest<{ Querystring: ReportQueryParams }>,
        reply: FastifyReply
    ) {
        const { startDate, endDate } = request.query;

        if (!startDate || !endDate) {
            return reply.status(400).send({ message: 'startDate and endDate are required.' });
        }

        try {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return reply.status(400).send({ message: 'Invalid date format for startDate or endDate.' });
            }

            const summary = await reportService.getMonthlyPayrollSummary(start, end);
            return reply.send(summary);
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({ message: 'Error retrieving monthly payroll summary.' });
        }
    },

    async getPph21Report(
        request: FastifyRequest<{ Querystring: ReportQueryParams }>,
        reply: FastifyReply
    ) {
        const { startDate, endDate } = request.query;

        if (!startDate || !endDate) {
            return reply.status(400).send({ message: 'startDate and endDate are required.' });
        }

        try {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return reply.status(400).send({ message: 'Invalid date format for startDate or endDate.' });
            }

            const report = await reportService.getPph21Report(start, end);
            return reply.send(report);
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({ message: 'Error retrieving PPh 21 report.' });
        }
    },

    // TODO: Tambahkan controller untuk laporan lain
};

export default reportController;