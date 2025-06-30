// src/controllers/authController.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import authService from '../services/authService';
import { User, UserRole } from '@prisma/client';

interface LoginBody {
    usernameOrEmail: string;
    password: string;
}

const authController = {
    async login(request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) {
        const { usernameOrEmail, password } = request.body;

        try {
            const user: (User & { roles: UserRole[] }) | null = await authService.verifyCredentials(usernameOrEmail, password);

            if (!user) {
                console.log(`[AuthController] Authentication failed for: ${usernameOrEmail}`);
                return reply.status(401).send({ message: 'Invalid credentials' });
            }
            const userRoleNames: string[] = user.roles.map((ur: UserRole) => ur.role);

            const tokenPayload = {
                id: user.id,
                username: user.username,
                email: user.email,
                roles: userRoleNames,
            };

            const token = (request as any).jwt
                ? (request as any).jwt.sign(tokenPayload, { expiresIn: '1h' })
                : (request.server as any).jwt.sign(tokenPayload, { expiresIn: '1h' });
            console.log(`[AuthController] Token generated for ${user.username}.`);

            const userResponse = {
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name,
                department: user.department,
                salary: user.salary ? user.salary.toNumber() : 0,
                status: user.status,
                joinDate: user.joinDate.toISOString(),
                roles: userRoleNames,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
            };

            return reply.send({ token, user: userResponse });
        } catch (error: any) {
            console.error(`[AuthController] UNHANDLED ERROR during login for ${usernameOrEmail}:`, error);
            return reply.status(500).send({ message: 'Internal server error during login' });
        }
    },

    async logout(request: FastifyRequest, reply: FastifyReply) {
        console.log(`[AuthController] Logout request received.`);
        return reply.status(200).send({ message: 'Logged out successfully' });
    },
};

export default authController;