// src/services/authService.ts
import { PrismaClient, User, UserRole } from '@prisma/client';
import { comparePassword } from '../utils/password';

const prisma = new PrismaClient();

const authService = {
    async verifyCredentials(usernameOrEmail: string, passwordAttempt: string): Promise<(User & { roles: UserRole[] }) | null> {
        console.log(`[AuthService] Attempting to verify credentials for: ${usernameOrEmail}`);
        try {
            const user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { username: usernameOrEmail },
                        { email: usernameOrEmail },
                    ],
                },
                include: {
                    roles: true,
                },
            });

            if (!user) {
                console.log(`[AuthService] User '${usernameOrEmail}' not found.`);
                return null;
            }

            console.log(`[AuthService] User '${user.username}' found. Comparing passwords...`);
            const isPasswordValid = await comparePassword(passwordAttempt, user.password);

            if (!isPasswordValid) {
                console.log(`[AuthService] Password invalid for user '${user.username}'.`);
                return null;
            }

            console.log(`[AuthService] User '${user.username}' authenticated successfully.`);
            return user;
        } catch (error) {
            console.error(`[AuthService] Error during verifyCredentials for ${usernameOrEmail}:`, error);
            throw error; // Lempar kembali error agar ditangkap di controller
        }
    },
};

export default authService;