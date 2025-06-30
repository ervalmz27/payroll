import { FastifyRequest, FastifyReply } from 'fastify';
import userService from '../services/userService';
import { User, UserRole } from '@prisma/client';


type UserWithRoles = User & { roles: UserRole[] };

interface UserBody {
    username: string;
    email: string;
    password?: string;
    name: string;
    department?: string;
    salary?: number;
    status?: string;
    joinDate?: string;
    roleNames?: string[];
}

const userController = {
    async getUsers(request: FastifyRequest, reply: FastifyReply) {
        try {
            const users: UserWithRoles[] = await userService.getAllUsers();
            const usersResponse = users.map(user => ({
                ...user,
                roles: user.roles.map((ur: any) => ur.role)
            }));
            return reply.send(usersResponse);
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({ message: 'Error retrieving users' });
        }
    },

    async getUser(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const user: UserWithRoles | null = await userService.getUserById(request.params.id);
            if (user) {
                const userResponse = {
                    ...user,
                    roles: user.roles.map((ur: any) => ur.role)
                };
                return reply.send(userResponse);
            }
            return reply.status(404).send({ message: 'User not found' });
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({ message: 'Error retrieving user' });
        }
    },

    async createUser(request: FastifyRequest<{ Body: UserBody }>, reply: FastifyReply) {
        try {
            const { username, email, password, name, department, salary, status, joinDate, roleNames } = request.body;
            if (!username || !email || !password || !name) {
                return reply.status(400).send({ message: 'Username, email, password, and name are required.' });
            }

            const newUserPayload = {
                username,
                email,
                password,
                name,
                department: department !== undefined ? department : null,
                status,
                salary: salary !== undefined ? parseFloat(salary.toString()) : undefined,
                joinDate: joinDate ? new Date(joinDate) : undefined,
                npwp: null,
                position: null,
                roleNames: roleNames || ["Karyawan"]
            };

            const newUser: UserWithRoles = await userService.createUser(newUserPayload);
            const newUserResponse = {
                ...newUser,
                roles: newUser.roles.map((ur: any) => ur.role)
            };
            return reply.status(201).send(newUserResponse);
        } catch (error: any) {
            request.log.error(error);
            if (error.code === 'P2002') {
                return reply.status(409).send({ message: 'User with this username or email already exists.' });
            }
            return reply.status(500).send({ message: 'Error creating user' });
        }
    },

    async updateUser(request: FastifyRequest<{ Params: { id: string }, Body: Partial<UserBody> }>, reply: FastifyReply) {
        try {
            const { salary, joinDate, roleNames, ...rest } = request.body;
            const dataToUpdate: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'password'>> & { password?: string, roleNames?: string[] } = { ...rest };

            if (salary !== undefined) {
                (dataToUpdate as any).salary = parseFloat(salary.toString());
            }
            if (joinDate !== undefined) {
                (dataToUpdate as any).joinDate = new Date(joinDate);
            }
            if (roleNames !== undefined) {
                dataToUpdate.roleNames = roleNames; // Serahkan roleNames ke service
            }

            const updatedUser: UserWithRoles = await userService.updateUser(request.params.id, dataToUpdate);
            // Mengubah format roles untuk respons
            const updatedUserResponse = {
                ...updatedUser,
                roles: updatedUser.roles.map((ur: any) => ur.role)
            };
            return reply.send(updatedUserResponse);
        } catch (error: any) {
            request.log.error(error);
            if (error.code === 'P2025') {
                return reply.status(404).send({ message: 'User not found' });
            }
            return reply.status(500).send({ message: 'Error updating user' });
        }
    },

    async deleteUser(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            await userService.deleteUser(request.params.id);
            return reply.status(204).send();
        } catch (error: any) {
            request.log.error(error);
            if (error.code === 'P2025') {
                return reply.status(404).send({ message: 'User not found' });
            }
            return reply.status(500).send({ message: 'Error deleting user' });
        }
    },
};

export default userController;