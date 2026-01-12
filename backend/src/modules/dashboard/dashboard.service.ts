import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    /**
     * สรุปภาพรวมของผู้ใช้
     */
    async getUserSummary(userId: string) {
        const [plotCount, activeCycles, totalActivities, recentActivities] = await Promise.all([
            // จำนวนแปลง
            this.prisma.plot.count({
                where: { userId, status: 'NORMAL' },
            }),
            // รอบปลูกที่ active
            this.prisma.cropCycle.count({
                where: {
                    plot: { userId },
                    status: 'ACTIVE',
                },
            }),
            // จำนวนกิจกรรมทั้งหมด
            this.prisma.activity.count({
                where: { userId },
            }),
            // กิจกรรมล่าสุด 5 รายการ
            this.prisma.activity.findMany({
                where: { userId },
                orderBy: { date: 'desc' },
                take: 5,
                include: {
                    plot: { select: { name: true } },
                    category: { select: { name: true } },
                },
            }),
        ]);

        return {
            plotCount,
            activeCycles,
            totalActivities,
            recentActivities,
        };
    }

    /**
     * สรุปรายได้-รายจ่าย
     */
    async getFinancialSummary(userId: string, year?: number, month?: number) {
        const currentYear = year || new Date().getFullYear();

        // สร้าง date range
        let startDate: Date;
        let endDate: Date;

        if (month) {
            startDate = new Date(currentYear, month - 1, 1);
            endDate = new Date(currentYear, month, 0, 23, 59, 59);
        } else {
            startDate = new Date(currentYear, 0, 1);
            endDate = new Date(currentYear, 11, 31, 23, 59, 59);
        }

        const activities = await this.prisma.activity.findMany({
            where: {
                userId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
                type: { in: ['INCOME', 'EXPENSE'] },
            },
            select: {
                type: true,
                amount: true,
            },
        });

        let totalIncome = 0;
        let totalExpense = 0;

        activities.forEach(a => {
            const amount = Number(a.amount) || 0;
            if (a.type === 'INCOME') {
                totalIncome += amount;
            } else if (a.type === 'EXPENSE') {
                totalExpense += amount;
            }
        });

        return {
            year: currentYear,
            month: month || null,
            totalIncome,
            totalExpense,
            netProfit: totalIncome - totalExpense,
            transactionCount: activities.length,
        };
    }

    /**
     * สรุปแปลง
     */
    async getPlotsSummary(userId: string) {
        const plots = await this.prisma.plot.findMany({
            where: { userId, status: 'NORMAL' },
            include: {
                cropCycles: {
                    where: { status: 'ACTIVE' },
                    include: {
                        cropVariety: {
                            include: { cropType: { select: { name: true } } },
                        },
                    },
                },
                _count: { select: { activities: true } },
            },
        });

        const totalSize = plots.reduce((sum, p) => sum + p.size, 0);

        return {
            plotCount: plots.length,
            totalSize,
            plots: plots.map(p => ({
                id: p.id,
                name: p.name,
                size: p.size,
                activeCycle: p.cropCycles[0] ? {
                    id: p.cropCycles[0].id,
                    variety: p.cropCycles[0].cropVariety?.name,
                    cropType: p.cropCycles[0].cropVariety?.cropType?.name,
                    startDate: p.cropCycles[0].startDate,
                } : null,
                activityCount: p._count.activities,
            })),
        };
    }

    /**
     * สถิติรายเดือน
     */
    async getMonthlyStats(userId: string, year?: number) {
        const currentYear = year || new Date().getFullYear();
        const startDate = new Date(currentYear, 0, 1);
        const endDate = new Date(currentYear, 11, 31, 23, 59, 59);

        const activities = await this.prisma.activity.findMany({
            where: {
                userId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
                type: { in: ['INCOME', 'EXPENSE'] },
            },
            select: {
                type: true,
                amount: true,
                date: true,
            },
        });

        // สร้าง array 12 เดือน
        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            income: 0,
            expense: 0,
        }));

        activities.forEach(a => {
            const month = a.date.getMonth();
            const amount = Number(a.amount) || 0;
            if (a.type === 'INCOME') {
                monthlyData[month].income += amount;
            } else if (a.type === 'EXPENSE') {
                monthlyData[month].expense += amount;
            }
        });

        return {
            year: currentYear,
            data: monthlyData,
        };
    }
}
