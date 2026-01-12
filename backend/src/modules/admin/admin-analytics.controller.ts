import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminBaseService } from './admin-base.service';

/**
 * AdminAnalyticsController - Analytics และ AI Usage
 */
@ApiTags('Admin - Analytics')
@Controller('admin')
@ApiBearerAuth()
export class AdminAnalyticsController {
    constructor(private readonly base: AdminBaseService) { }

    // ==================== PRODUCT ANALYTICS ====================

    @Get('analytics/products')
    @ApiOperation({ summary: 'สถิติ impressions/clicks ของสินค้า' })
    @ApiQuery({ name: 'days', required: false, description: 'จำนวนวันย้อนหลัง (default: 30)' })
    async getProductAnalytics(
        @Query('days') days: string = '30',
    ) {
        const daysNum = parseInt(days, 10);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysNum);

        // Top products by impressions
        const topByImpressions = await this.base.prisma.productImpression.groupBy({
            by: ['productId'],
            where: { createdAt: { gte: startDate } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 10,
        });

        // Top products by clicks
        const topByClicks = await this.base.prisma.productClick.groupBy({
            by: ['productId'],
            where: { createdAt: { gte: startDate } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 10,
        });

        // Get product names
        const productIds = [...new Set([
            ...topByImpressions.map((i: { productId: string }) => i.productId),
            ...topByClicks.map((c: { productId: string }) => c.productId),
        ])];

        const products = await this.base.prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true, imageUrl: true },
        });

        const productMap = new Map(products.map(p => [p.id, p]));

        return {
            period: { startDate, endDate: new Date(), days: daysNum },
            topByImpressions: topByImpressions.map((i: { productId: string; _count: { id: number } }) => ({
                product: productMap.get(i.productId),
                impressions: i._count.id,
            })),
            topByClicks: topByClicks.map((c: { productId: string; _count: { id: number } }) => ({
                product: productMap.get(c.productId),
                clicks: c._count.id,
            })),
        };
    }

    @Get('analytics/products/:id')
    @ApiOperation({ summary: 'สถิติ impressions/clicks ของสินค้าเฉพาะ' })
    async getProductAnalyticsById(
        @Param('id') productId: string,
        @Query('days') days: string = '30',
    ) {
        const daysNum = parseInt(days, 10);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysNum);

        const [impressions, clicks, product] = await Promise.all([
            this.base.prisma.productImpression.count({
                where: { productId, createdAt: { gte: startDate } },
            }),
            this.base.prisma.productClick.count({
                where: { productId, createdAt: { gte: startDate } },
            }),
            this.base.prisma.product.findUnique({
                where: { id: productId },
                select: { id: true, name: true, imageUrl: true, isSponsored: true },
            }),
        ]);

        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

        return {
            product,
            period: { startDate, endDate: new Date(), days: daysNum },
            impressions,
            clicks,
            ctr: parseFloat(ctr.toFixed(2)),
        };
    }

    @Post('analytics/track-impression')
    @ApiOperation({ summary: 'บันทึก product impression' })
    async trackImpression(
        @Body() body: {
            productId: string;
            userId?: string;
            plotId?: string;
            source: string;
        },
    ) {
        await this.base.prisma.productImpression.create({
            data: {
                productId: body.productId,
                userId: body.userId,
                plotId: body.plotId,
                source: body.source,
            },
        });

        return { success: true };
    }

    @Post('analytics/track-click')
    @ApiOperation({ summary: 'บันทึก product click' })
    async trackClick(
        @Body() body: {
            productId: string;
            userId?: string;
            source?: string;
        },
    ) {
        await this.base.prisma.productClick.create({
            data: {
                productId: body.productId,
                userId: body.userId,
                source: body.source,
            },
        });

        return { success: true };
    }

    // ==================== AI USAGE & COST ====================

    @Get('ai/usage')
    @ApiOperation({ summary: 'สถิติการใช้งาน AI' })
    @ApiQuery({ name: 'days', required: false })
    async getAiUsage(
        @Query('days') days: string = '30',
    ) {
        const daysNum = parseInt(days, 10);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysNum);

        // สถิติตาม provider
        const byProvider = await this.base.prisma.aiRequestLog.groupBy({
            by: ['provider'],
            where: { createdAt: { gte: startDate } },
            _count: { id: true },
            _sum: { totalTokens: true, costUsd: true },
        });

        // Total
        const totals = await this.base.prisma.aiRequestLog.aggregate({
            where: { createdAt: { gte: startDate } },
            _count: { id: true },
            _sum: { totalTokens: true, costUsd: true, inputTokens: true, outputTokens: true },
            _avg: { latencyMs: true },
        });

        // Success rate
        const successCount = await this.base.prisma.aiRequestLog.count({
            where: { createdAt: { gte: startDate }, success: true },
        });

        const successRate = totals._count.id > 0 ? (successCount / totals._count.id) * 100 : 0;

        return {
            period: { startDate, endDate: new Date(), days: daysNum },
            totals: {
                requests: totals._count.id,
                totalTokens: totals._sum.totalTokens || 0,
                inputTokens: totals._sum.inputTokens || 0,
                outputTokens: totals._sum.outputTokens || 0,
                costUsd: parseFloat(totals._sum.costUsd?.toString() || '0'),
                avgLatencyMs: Math.round(totals._avg.latencyMs || 0),
                successRate: parseFloat(successRate.toFixed(2)),
            },
            byProvider: byProvider.map((p: { provider: string; _count: { id: number }; _sum: { totalTokens: number | null; costUsd: any } }) => ({
                provider: p.provider,
                requests: p._count.id,
                totalTokens: p._sum.totalTokens || 0,
                costUsd: parseFloat(p._sum.costUsd?.toString() || '0'),
            })),
        };
    }

    @Get('ai/logs')
    @ApiOperation({ summary: 'รายการ AI request logs' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'provider', required: false })
    @ApiQuery({ name: 'success', required: false })
    async getAiLogs(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '50',
        @Query('provider') provider?: string,
        @Query('success') success?: string,
    ) {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};
        if (provider) where.provider = provider;
        if (success !== undefined) where.success = success === 'true';

        const [items, total] = await Promise.all([
            this.base.prisma.aiRequestLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum,
            }),
            this.base.prisma.aiRequestLog.count({ where }),
        ]);

        return {
            items,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        };
    }

    // ==================== DASHBOARD STATS ====================

    @Get('dashboard/user-growth')
    @ApiOperation({ summary: 'สถิติการเติบโตของผู้ใช้' })
    @ApiQuery({ name: 'days', required: false })
    async getUserGrowth(@Query('days') days: string = '30') {
        const daysNum = parseInt(days) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysNum);

        const users = await this.base.prisma.user.findMany({
            where: { createdAt: { gte: startDate } },
            select: { createdAt: true },
            orderBy: { createdAt: 'asc' },
        });

        // Group by date
        const grouped: Record<string, number> = {};
        users.forEach(u => {
            const dateKey = u.createdAt.toISOString().split('T')[0];
            grouped[dateKey] = (grouped[dateKey] || 0) + 1;
        });

        return Object.entries(grouped).map(([date, count]) => ({ date, count }));
    }

    @Get('dashboard/plot-stats')
    @ApiOperation({ summary: 'สถิติแปลงตามสถานะ' })
    async getPlotStats() {
        const plots = await this.base.prisma.plot.findMany({
            select: { status: true },
        });

        const counts: Record<string, number> = {};
        plots.forEach(p => {
            counts[p.status] = (counts[p.status] || 0) + 1;
        });

        return Object.entries(counts).map(([status, count]) => ({ status, count }));
    }

    @Get('dashboard/activity-by-type')
    @ApiOperation({ summary: 'สถิติกิจกรรมตามประเภท' })
    async getActivityByType() {
        const activities = await this.base.prisma.activity.findMany({
            select: { type: true },
        });

        const counts: Record<string, number> = {};
        activities.forEach(a => {
            counts[a.type] = (counts[a.type] || 0) + 1;
        });

        return Object.entries(counts).map(([type, count]) => ({ type, count }));
    }
}
