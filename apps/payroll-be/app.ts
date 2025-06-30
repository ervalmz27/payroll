// app.js
const fastify = require('fastify')({ logger: true });
// const userRoutes = require('./routes/userRoutes');

// fastify.register(userRoutes);

// Hook untuk menutup koneksi Prisma saat aplikasi Fastify berhenti
fastify.addHook('onClose', async (instance) => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$disconnect();
    instance.log.info('Prisma Client disconnected');
});

const start = async () => {
    try {
        await fastify.listen({ port: 3000, host: '0.0.0.0' });
        fastify.log.info(`Server listening on ${fastify.server.address().port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();