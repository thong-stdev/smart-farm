import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PlanStage } from '@prisma/client';
import { LineBotService } from '../line-bot/line-bot.service';
import { FlexMessageBuilder } from '../line-bot/flex-message.builder';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    constructor(
        private prisma: PrismaService,
        private lineBotService: LineBotService,
        private flexBuilder: FlexMessageBuilder,
    ) { }

    /**
     * ส่งแจ้งเตือนประจำวัน (Cron Job เรียกใช้)
     */
    async sendDailyNotifications() {
        this.logger.log('Starting daily notifications...');

        // 1. หา user ที่เปิดแจ้งเตือนและมี LINE
        const users = await this.prisma.user.findMany({
            where: {
                OR: [
                    { lineUserId: { not: null } },
                    { providers: { some: { provider: 'LINE' } } }
                ],
                // ถ้ามี settings ต้องเปิด notification (ถ้าไม่มี settings ถือว่าเปิด)
                AND: [
                    {
                        OR: [
                            { settings: { is: null } },
                            // @ts-ignore - Prisma Client might be outdated
                            { settings: { enableNotifications: true } }
                        ]
                    }
                ]
            },
            include: {
                settings: true,
                providers: { where: { provider: 'LINE' } }
            }
        });

        this.logger.log(`Found ${users.length} users enabled for notifications`);

        let sentCount = 0;

        for (const user of users) {
            // @ts-ignore - Prisma Client might be outdated for relations
            const u = user as any;

            try {
                // 2. ดึงงานที่ต้องทำวันนี้
                const tasks = await this.getTodayTasks(u.id);

                if (tasks.length === 0) continue;

                // 3. หา LINE UID
                const lineUid = u.lineUserId || u.providers?.[0]?.providerUid;
                if (!lineUid) continue;

                // 4. สร้างข้อความแจ้งเตือน
                const message = this.buildDailyTaskMessage(tasks);

                // 5. ส่ง LINE (ถ้ามี)
                await this.lineBotService.pushMessage(lineUid, [message]);

                // 6. บันทึกลงฐานข้อมูล (SystemNotification)
                await this.createNotification(
                    user.id,
                    'งานที่ต้องทำวันนี้',
                    message.text,
                    'INFO'
                );

                sentCount++;

            } catch (error) {
                this.logger.error(`Failed to notify user ${user.id}: ${error}`);
            }
        }

        this.logger.log(`Daily notifications sent to ${sentCount} users`);
        return { sentCount, totalUsers: users.length };
    }

    /**
     * สร้าง Notification ลง DB
     */
    async createNotification(userId: string, title: string, message: string, type: string = 'INFO') {
        return this.prisma.systemNotification.create({
            data: {
                title,
                message,
                type,
                target: 'SPECIFIC',
                targets: {
                    create: { userId }
                }
            }
        });
    }

    private buildDailyTaskMessage(tasks: any[]) {
        // Simple Text Message for MVP
        let text = `📅 งานที่ต้องทำวันนี้ (${new Date().toLocaleDateString('th-TH')})\n\n`;

        tasks.forEach((task, index) => {
            text += `${index + 1}. ${task.stageName}\n`;
            text += `   📍 ${task.plot} - ${task.crop}\n`;
            text += `   📝 ${task.action} (${task.method})\n`;
            text += `   ----------------\n`;
        });

        text += `\nอย่าลืมบันทึกหลังจากทำเสร็จนะครับ! 💪`;

        return { type: 'text', text };
    }

    /**
     * ดึงกิจกรรมที่ต้องทำวันนี้ (Task Reminders)
     */
    async getTodayTasks(userId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // ดึง active crop cycles
        const activeCycles = await this.prisma.cropCycle.findMany({
            where: {
                plot: { userId },
                status: 'ACTIVE',
            },
            include: {
                plan: {
                    include: {
                        stages: {
                            orderBy: { dayStart: 'asc' },
                        },
                    },
                },
                plot: { select: { name: true } },
                cropVariety: {
                    include: { cropType: { select: { name: true } } },
                },
            },
        });

        const tasks: any[] = [];

        activeCycles.forEach(cycle => {
            if (!cycle.plan?.stages) return;

            const daysSinceStart = Math.floor(
                (today.getTime() - cycle.startDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            // หา stage ที่ตรงกับวันนี้
            cycle.plan.stages.forEach((stage: PlanStage) => {
                if (daysSinceStart >= stage.dayStart &&
                    (stage.dayEnd === null || daysSinceStart <= stage.dayEnd)) {
                    tasks.push({
                        type: 'TASK',
                        cycleId: cycle.id,
                        plot: cycle.plot.name,
                        crop: `${cycle.cropVariety?.cropType?.name}: ${cycle.cropVariety?.name}`,
                        stageName: stage.stageName,
                        action: stage.action,
                        method: stage.method,
                        dayStart: stage.dayStart,
                        dayEnd: stage.dayEnd,
                        currentDay: daysSinceStart,
                    });
                }
            });
        });

        return tasks;
    }

    /**
     * ดึงแจ้งเตือนทั้งหมด (Upcoming tasks)
     */
    async getUpcomingTasks(userId: string, days: number = 7) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeCycles = await this.prisma.cropCycle.findMany({
            where: {
                plot: { userId },
                status: 'ACTIVE',
            },
            include: {
                plan: {
                    include: {
                        stages: {
                            orderBy: { dayStart: 'asc' },
                        },
                    },
                },
                plot: { select: { name: true } },
                cropVariety: {
                    include: { cropType: { select: { name: true } } },
                },
            },
        });

        const upcoming: any[] = [];

        activeCycles.forEach(cycle => {
            if (!cycle.plan?.stages) return;

            const daysSinceStart = Math.floor(
                (today.getTime() - cycle.startDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            // หา stage ที่จะเกิดขึ้นใน X วันข้างหน้า
            cycle.plan.stages.forEach((stage: PlanStage) => {
                const daysUntilStart = stage.dayStart - daysSinceStart;

                if (daysUntilStart > 0 && daysUntilStart <= days) {
                    upcoming.push({
                        type: 'UPCOMING',
                        cycleId: cycle.id,
                        plot: cycle.plot.name,
                        crop: `${cycle.cropVariety?.cropType?.name}: ${cycle.cropVariety?.name}`,
                        stageName: stage.stageName,
                        action: stage.action,
                        daysUntil: daysUntilStart,
                        expectedDay: stage.dayStart,
                    });
                }
            });
        });

        // เรียงตาม daysUntil
        upcoming.sort((a, b) => a.daysUntil - b.daysUntil);

        return upcoming;
    }

    /**
     * สรุปแจ้งเตือน
     */
    async getNotificationSummary(userId: string) {
        const [todayTasks, upcomingTasks, unreadCount] = await Promise.all([
            this.getTodayTasks(userId),
            this.getUpcomingTasks(userId, 7),
            this.prisma.notificationTarget.count({
                where: {
                    userId,
                    notification: { type: { not: 'SYSTEM' } } // Example filter
                }
            })
        ]);

        return {
            todayCount: todayTasks.length,
            upcomingCount: upcomingTasks.length,
            todayTasks,
            upcomingTasks,
        };
    }

    /**
     * ดึงประวัติการแจ้งเตือน
     */
    async getUserNotifications(userId: string, limit: number = 20, offset: number = 0) {
        // ดึงรายการที่ส่งหาเรา (Target)
        const items = await this.prisma.notificationTarget.findMany({
            where: { userId },
            include: {
                notification: true
            },
            orderBy: { notification: { createdAt: 'desc' } },
            take: limit,
            skip: offset,
        });

        // ดึงรายการที่อ่านแล้ว
        const reads = await this.prisma.notificationRead.findMany({
            where: {
                userId,
                notificationId: { in: items.map(i => i.notificationId) }
            }
        });

        const readSet = new Set(reads.map(r => r.notificationId));

        return items.map(item => ({
            id: item.notification.id,
            title: item.notification.title,
            message: item.notification.message,
            type: item.notification.type,
            createdAt: item.notification.createdAt,
            isRead: readSet.has(item.notificationId),
        }));
    }

    /**
     * อ่านแจ้งเตือน
     */
    async markAsRead(userId: string, notificationId: string) {
        return this.prisma.notificationRead.upsert({
            where: {
                notificationId_userId: {
                    notificationId,
                    userId
                }
            },
            update: {},
            create: {
                notificationId,
                userId
            }
        });
    }

    /**
     * อ่านทั้งหมด
     */
    async markAllAsRead(userId: string) {
        // หา notification ที่ยังไม่อ่าน
        // (ใน MVP อาจจะใช้วิธีง่ายๆ คือ mark ตาม list ล่าสุด หรือจะ query complex หน่อยก็ได้)
        // เพื่อความง่ายใน MVP: ให้ FE ส่ง ID มาทีละอัน หรือ loop เรียก
        // แต่อันนี้ทำเผื่อไว้: Mark all targets as read
        const targets = await this.prisma.notificationTarget.findMany({
            where: { userId },
            select: { notificationId: true }
        });

        const reads = targets.map(t => ({
            userId,
            notificationId: t.notificationId
        }));

        await this.prisma.notificationRead.createMany({
            data: reads,
            skipDuplicates: true
        });

        return { success: true };
    }
}
