// src/routes/userRoutes.ts
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import userController from '../controllers/userController';

async function userRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {

    fastify.addHook('preHandler', fastify.authenticate);
    const hasRole = (request: any, requiredRoles: string[]) => {
        return requiredRoles.some(role => request.user.roles.includes(role));
    };
    fastify.get('/users', {
        preHandler: async (request, reply) => {
            if (!hasRole(request, ['Manager HR', 'Staff HR'])) {
                return reply.status(403).send({ message: 'Forbidden: Only Manager HR can access this resource.' });
            }
        },
        handler: userController.getUsers
    });
    fastify.post('/users', {
        preHandler: async (request, reply) => {
            if (!hasRole(request, ['Staff HR', 'Manager HR'])) {
                return reply.status(403).send({ message: 'Forbidden: Only HR staff can create users.' });
            }
        },
        handler: userController.createUser
    });

    fastify.get('/users/:id', {
        preHandler: async (request, reply) => {
            const userId = parseInt(request.params.id);
            if (
                (!hasRole(request, ['Staff HR', 'Manager HR'])) &&
                request.user.id !== userId
            ) {
                return reply.status(403).send({ message: 'Forbidden: You can only view your own profile.' });
            }
        },
        handler: userController.getUser
    });

    fastify.put('/users/:id', {
        preHandler: async (request, reply) => {
            const userId = parseInt(request.params.id);
            if (
                (!hasRole(request, ['Staff HR', 'Manager HR'])) &&
                request.user.id !== userId
            ) {
                return reply.status(403).send({ message: 'Forbidden: You can only update your own profile.' });
            }
        },
        handler: userController.updateUser
    });

    fastify.delete('/users/:id', {
        preHandler: async (request, reply) => {
            if (!hasRole(request, ['Manager HR'])) {
                return reply.status(403).send({ message: 'Forbidden: Only Manager HR can delete users.' });
            }
        },
        handler: userController.deleteUser
    });
}

export default userRoutes;