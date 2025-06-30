import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import authController from '../controllers/authController';

async function authRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    fastify.post('/login', authController.login);
    fastify.post('/logout', authController.logout);
}

export default authRoutes;