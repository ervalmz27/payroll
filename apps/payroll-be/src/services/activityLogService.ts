// src/services/activityLogService.ts
import { PrismaClient, ActivityLog } from '@prisma/client';

const prisma = new PrismaClient();

const activityLogService = {
    async logActivity(activity: string, type: string, userId?: number): Promise<ActivityLog> {
        return await prisma.activityLog.create({
            data: {
                activity,
                type,
                userId,
            },
        });
    },

    async getRecentActivities(limit: number = 5): Promise<ActivityLog[]> {
        return await prisma.activityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
                id: true,
                activity: true,
                type: true,
                createdAt: true,
            },
        });
    },
};

export default activityLogService;