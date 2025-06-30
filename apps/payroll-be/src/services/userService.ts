// src/services/userService.ts
import { PrismaClient, User, UserRole } from '@prisma/client';
import { hashPassword } from '../utils/password';

const prisma = new PrismaClient();
type UserWithRoles = User & { roles: UserRole[] };

const userService = {
    getAllUsers: async (): Promise<any[]> => {
        return await prisma.user.findMany({
            select: {
                id: true, username: true, email: true, name: true,
                department: true, salary: true, status: true,
                position: true,
                joinDate: true, roles: { select: { id: true, role: true } },
                createdAt: true, updatedAt: true,
            },
        });
    },

    getUserById: async (id: string): Promise<UserWithRoles | null> => {
        return await prisma.user.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                password: true,
                department: true,
                salary: true,
                npwp: true,
                position: true,
                status: true,
                joinDate: true,
                roles: { select: { id: true, role: true } },
                createdAt: true,
                updatedAt: true,
            },
        });
    },

    createUser: async (
        userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'roles'> & { roleNames?: string[] }
    ): Promise<UserWithRoles> => {
        const hashedPassword = await hashPassword(userData.password);

        const newUser = await prisma.user.create({
            data: {
                username: userData.username,
                email: userData.email,
                password: hashedPassword,
                name: userData.name,
                department: userData.department,
                salary: userData.salary,
                status: userData.status,
                joinDate: userData.joinDate,
                roles: {
                    create: (userData.roleNames || ['Karyawan']).map(roleName => ({ role: roleName })),
                },
            },
            include: {
                roles: true,
            },
        });

        return newUser;
    },

    updateUser: async (
        id: string,
        userData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'password' | 'roles'>> & { password?: string, roleNames?: string[] }
    ): Promise<UserWithRoles> => {
        let dataToUpdate: any = { ...userData };

        if (userData.password) {
            dataToUpdate.password = await hashPassword(userData.password);
        }

        // Tangani pembaruan peran
        if (userData.roleNames !== undefined) {
            // Hapus semua peran yang ada untuk user ini terlebih dahulu
            await prisma.userRole.deleteMany({
                where: { userId: parseInt(id) },
            });
            // Buat peran baru
            dataToUpdate.roles = {
                create: userData.roleNames.map(roleName => ({ role: roleName })),
            };
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: dataToUpdate,
            include: {
                roles: true, // Sertakan roles dalam respons
            },
        });

        return updatedUser;
    },

    deleteUser: async (id: string): Promise<User> => {
        await prisma.userRole.deleteMany({
            where: { userId: parseInt(id) },
        });
        return await prisma.user.delete({
            where: { id: parseInt(id) },
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                password: true,
                department: true,
                salary: true,
                npwp: true,
                position: true,
                status: true,
                joinDate: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    },
};

export default userService;