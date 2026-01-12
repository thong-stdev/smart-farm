import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ReportService {
    constructor(private prisma: PrismaService) { }

    /**
     * รายงานประจำเดือน
     */
    async getMonthlyReport(userId: string, year: number, month: number) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const [activities, plots] = await Promise.all([
            this.prisma.activity.findMany({
                where: {
                    userId,
                    date: { gte: startDate, lte: endDate },
                },
                include: {
                    plot: { select: { name: true } },
                    category: { select: { name: true } },
                    product: { select: { name: true } },
                },
                orderBy: { date: 'asc' },
            }),
            this.prisma.plot.findMany({
                where: { userId, status: 'NORMAL' },
                select: { id: true, name: true },
            }),
        ]);

        // คำนวณสรุป
        let totalIncome = 0;
        let totalExpense = 0;
        const byCategory: Record<string, { count: number; amount: number }> = {};
        const byPlot: Record<string, { name: string; income: number; expense: number; count: number }> = {};

        activities.forEach(a => {
            const amount = Number(a.amount) || 0;

            if (a.type === 'INCOME') totalIncome += amount;
            if (a.type === 'EXPENSE') totalExpense += amount;

            // By Category
            const catName = a.category?.name || 'ไม่ระบุ';
            if (!byCategory[catName]) byCategory[catName] = { count: 0, amount: 0 };
            byCategory[catName].count++;
            byCategory[catName].amount += amount;

            // By Plot
            const plotId = a.plotId || 'no-plot';
            const plotName = a.plot?.name || 'ไม่ระบุแปลง';
            if (!byPlot[plotId]) byPlot[plotId] = { name: plotName, income: 0, expense: 0, count: 0 };
            byPlot[plotId].count++;
            if (a.type === 'INCOME') byPlot[plotId].income += amount;
            if (a.type === 'EXPENSE') byPlot[plotId].expense += amount;
        });

        return {
            period: {
                year,
                month,
                startDate,
                endDate,
            },
            summary: {
                totalActivities: activities.length,
                totalIncome,
                totalExpense,
                netProfit: totalIncome - totalExpense,
            },
            byCategory: Object.entries(byCategory).map(([name, data]) => ({
                name,
                ...data,
            })),
            byPlot: Object.values(byPlot),
            activities: activities.map(a => ({
                id: a.id,
                date: a.date,
                type: a.type,
                category: a.category?.name,
                plot: a.plot?.name,
                product: a.product?.name,
                amount: a.amount,
                description: a.description,
            })),
        };
    }

    /**
     * รายงานประจำปี
     */
    async getYearlyReport(userId: string, year: number) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);

        const activities = await this.prisma.activity.findMany({
            where: {
                userId,
                date: { gte: startDate, lte: endDate },
                type: { in: ['INCOME', 'EXPENSE'] },
            },
            select: {
                type: true,
                amount: true,
                date: true,
            },
        });

        // สรุปรายเดือน
        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            income: 0,
            expense: 0,
            count: 0,
        }));

        let totalIncome = 0;
        let totalExpense = 0;

        activities.forEach(a => {
            const month = a.date.getMonth();
            const amount = Number(a.amount) || 0;

            monthlyData[month].count++;
            if (a.type === 'INCOME') {
                monthlyData[month].income += amount;
                totalIncome += amount;
            } else {
                monthlyData[month].expense += amount;
                totalExpense += amount;
            }
        });

        return {
            year,
            summary: {
                totalActivities: activities.length,
                totalIncome,
                totalExpense,
                netProfit: totalIncome - totalExpense,
            },
            monthlyData,
        };
    }

    /**
     * รายงานรอบปลูก
     */
    async getCropCycleReport(userId: string, cycleId: string) {
        const cycle = await this.prisma.cropCycle.findFirst({
            where: {
                id: cycleId,
                plot: { userId },
            },
            include: {
                plot: { select: { name: true, size: true } },
                cropVariety: {
                    include: { cropType: { select: { name: true } } },
                },
                activities: {
                    include: {
                        category: { select: { name: true } },
                        product: { select: { name: true } },
                    },
                    orderBy: { date: 'asc' },
                },
            },
        });

        if (!cycle) {
            throw new Error('ไม่พบรอบปลูก');
        }

        let totalIncome = 0;
        let totalExpense = 0;

        cycle.activities.forEach((a: any) => {
            const amount = Number(a.amount) || 0;
            if (a.type === 'INCOME') totalIncome += amount;
            if (a.type === 'EXPENSE') totalExpense += amount;
        });

        const daysElapsed = Math.floor(
            (new Date().getTime() - cycle.startDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
            cycle: {
                id: cycle.id,
                plot: cycle.plot.name,
                plotSize: cycle.plot.size,
                cropType: cycle.cropVariety?.cropType?.name,
                variety: cycle.cropVariety?.name,
                startDate: cycle.startDate,
                endDate: cycle.endDate,
                status: cycle.status,
                daysElapsed,
            },
            summary: {
                totalActivities: cycle.activities.length,
                totalIncome,
                totalExpense,
                netProfit: totalIncome - totalExpense,
                profitPerRai: cycle.plot.size > 0 ? (totalIncome - totalExpense) / cycle.plot.size : 0,
            },
            activities: cycle.activities.map((a: any) => ({
                id: a.id,
                date: a.date,
                type: a.type,
                category: a.category?.name,
                product: a.product?.name,
                amount: a.amount,
                description: a.description,
            })),
        };
    }
}
