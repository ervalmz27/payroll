// src/app.ts
import Fastify, { FastifyInstance } from 'fastify';
import dotenv from 'dotenv';
import cors from '@fastify/cors';
import authPlugin from './plugins/authPlugin'; // Impor plugin autentikasi
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import { PrismaClient } from '@prisma/client';
import payrollRoutes from './routes/payrollRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import reportRoutes from './routes/reportRoutes';
import payslipRoutes from './routes/payslipRoutes';
dotenv.config(); // Load environment variables from .env

const fastify: FastifyInstance = Fastify({
    logger: true,
});

// Register CORS
fastify.register(cors, {
    origin: '*', // Sesuaikan dengan domain frontend Anda di produksi
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
});

// Register JWT Plugin
fastify.register(authPlugin);

fastify.register(authRoutes, { prefix: '/auth' });
fastify.register(userRoutes);
fastify.register(payrollRoutes);
fastify.register(dashboardRoutes);
fastify.register(reportRoutes);
fastify.register(payslipRoutes);

// Hook to disconnect Prisma Client when Fastify application closes
fastify.addHook('onClose', async (instance) => {
    const prisma = new PrismaClient();
    await prisma.$disconnect();
    instance.log.info('Prisma Client disconnected');
});

const start = async () => {
    try {
        const port = parseInt(process.env.PORT || '4200', 10);
        await fastify.listen({ port, host: '0.0.0.0' });
        const address = fastify.server.address();
        if (address && typeof address === 'object' && 'port' in address) {
            fastify.log.info(`Server listening on ${(address as any).port}`);
        } else {
            fastify.log.info('Server listening');
        }
    } catch (err: any) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();