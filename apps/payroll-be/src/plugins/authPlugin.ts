// src/plugins/authPlugin.ts
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';

// Perbarui deklarasi tipe untuk FastifyInstance
declare module 'fastify' {
    interface FastifyInstance {
        authenticate: any;
    }
}

// Perbarui payload JWT
interface UserPayload {
    id: number;
    username: string;
    email: string;
    roles: string[]; // Ini adalah array string dari nama peran
}

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: UserPayload;
        user: UserPayload;
    }
}

async function authPlugin(fastify: FastifyInstance, options: FastifyPluginOptions) {
    fastify.register(jwt, {
        secret: process.env.JWT_SECRET || 'supersecretjwtkey',
    });

    fastify.decorate('authenticate', async function (request: any, reply: any) {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.send(err);
        }
    });
}

export default fp(authPlugin);