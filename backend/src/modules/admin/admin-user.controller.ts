import { Controller, Get, Post, Param, Query, Delete, Patch, Body, Ip, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { AdminBaseService } from './admin-base.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * AdminUserController - จัดการผู้ใช้ระบบ
 */
@ApiTags('Admin - Users')
@Controller('admin')
@ApiBearerAuth()
export class AdminUserController {
    constructor(private readonly base: AdminBaseService) { }

    @Get('stats')
    @ApiOperation({ summary: 'ดึงสถิติภาพรวมระบบ' })
    @ApiResponse({ status: 200, description: 'สถิติระบบ' })
    async getStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            totalUsers,
            totalPlots,
            totalActivities,
            todayActivities,
            totalProducts,
            totalCropTypes,
        ] = await Promise.all([
            this.base.prisma.user.count({ where: { deletedAt: null } }),
            this.base.prisma.plot.count({ where: { deletedAt: null } }),
            this.base.prisma.activity.count({ where: { deletedAt: null } }),
            this.base.prisma.activity.count({
                where: {
                    deletedAt: null,
                    createdAt: { gte: today },
                },
            }),
            this.base.prisma.product.count(),
            this.base.prisma.cropType.count(),
        ]);

        const incomeResult = await this.base.prisma.activity.aggregate({
            where: { type: 'INCOME', deletedAt: null },
            _sum: { amount: true },
        });
        const expenseResult = await this.base.prisma.activity.aggregate({
            where: { type: 'EXPENSE', deletedAt: null },
            _sum: { amount: true },
        });

        return {
            totalUsers,
            totalPlots,
            totalActivities,
            todayActivities,
            totalProducts,
            totalCropTypes,
            totalIncome: incomeResult._sum.amount || 0,
            totalExpense: expenseResult._sum.amount || 0,
        };
    }

    @Get('users')
    @ApiOperation({ summary: 'ดึงรายชื่อผู้ใช้ทั้งหมด' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    async getUsers(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
        @Query('search') search?: string,
    ) {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;
        const skip = (pageNum - 1) * limitNum;

        const where: any = {}; // Admin เห็นผู้ใช้ทั้งหมด รวมถึงที่ถูกระงับ
        if (search) {
            where.OR = [
                { displayName: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await Promise.all([
            this.base.prisma.user.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    providers: { select: { provider: true, email: true } },
                    _count: { select: { plots: true, activities: true } },
                },
            }),
            this.base.prisma.user.count({ where }),
        ]);

        return {
            items: users.map(u => ({
                id: u.id,
                displayName: u.displayName,
                firstName: u.firstName,
                lastName: u.lastName,
                pictureUrl: u.pictureUrl,
                email: u.providers.find(p => p.email)?.email || null,
                providers: u.providers,
                plotCount: u._count.plots,
                activityCount: u._count.activities,
                status: u.deletedAt ? 'SUSPENDED' : 'ACTIVE',
                createdAt: u.createdAt,
            })),
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        };
    }

    @Get('users/:id')
    @ApiOperation({ summary: 'ดึงข้อมูลผู้ใช้' })
    async getUserById(@Param('id') id: string) {
        const user = await this.base.prisma.user.findUnique({
            where: { id },
            include: {
                providers: { select: { provider: true, email: true, createdAt: true } },
                plots: {
                    where: { deletedAt: null },
                    select: { id: true, name: true, size: true, status: true },
                },
                _count: { select: { plots: true, activities: true } },
            },
        });

        if (!user) return { error: 'User not found' };

        const incomeResult = await this.base.prisma.activity.aggregate({
            where: { userId: id, type: 'INCOME', deletedAt: null },
            _sum: { amount: true },
        });
        const expenseResult = await this.base.prisma.activity.aggregate({
            where: { userId: id, type: 'EXPENSE', deletedAt: null },
            _sum: { amount: true },
        });

        return {
            id: user.id,
            displayName: user.displayName,
            firstName: user.firstName,
            lastName: user.lastName,
            pictureUrl: user.pictureUrl,
            email: user.providers.find(p => p.email)?.email || null,
            providers: user.providers,
            plots: user.plots,
            plotCount: user._count.plots,
            activityCount: user._count.activities,
            totalIncome: incomeResult._sum.amount || 0,
            totalExpense: expenseResult._sum.amount || 0,
            status: user.deletedAt ? 'SUSPENDED' : 'ACTIVE',
            createdAt: user.createdAt,
            deletedAt: user.deletedAt,
        };
    }

    @Patch('users/:id/status')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'ระงับ/เปิดใช้งานผู้ใช้' })
    async updateUserStatus(
        @Param('id') id: string,
        @Body() body: { status: 'ACTIVE' | 'SUSPENDED' },
        @Request() req: any,
        @Ip() ip: string,
    ) {
        const deletedAt = body.status === 'SUSPENDED' ? new Date() : null;

        await this.base.prisma.user.update({
            where: { id },
            data: { deletedAt },
        });

        await this.base.logAction(
            body.status === 'SUSPENDED' ? 'SUSPEND_USER' : 'ACTIVATE_USER',
            'User',
            id,
            { status: body.status },
            ip,
            req?.user?.sub
        );

        return { success: true, status: body.status };
    }

    @Delete('users/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'ลบผู้ใช้ (Soft delete)' })
    async deleteUser(@Param('id') id: string, @Request() req: any, @Ip() ip: string) {
        await this.base.prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        await this.base.logAction('DELETE', 'User', id, undefined, ip, req?.user?.sub);

        return { success: true };
    }

    @Get('users/:id/plots')
    @ApiOperation({ summary: 'ดึงแปลงของผู้ใช้' })
    async getUserPlots(@Param('id') id: string) {
        const plots = await this.base.prisma.plot.findMany({
            where: { userId: id, deletedAt: null },
            include: {
                _count: { select: { activities: true, cropCycles: true } },
                cropCycles: {
                    where: { status: 'ACTIVE' },
                    select: { id: true, cropType: true, startDate: true },
                    take: 1,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return plots.map(p => ({
            id: p.id,
            name: p.name,
            size: p.size,
            status: p.status,
            activityCount: p._count.activities,
            cycleCount: p._count.cropCycles,
            activeCycle: p.cropCycles[0] || null,
            createdAt: p.createdAt,
        }));
    }

    @Get('users/export/csv')
    @ApiOperation({ summary: 'Export รายชื่อผู้ใช้เป็น CSV' })
    async exportUsersCsv() {
        const users = await this.base.prisma.user.findMany({
            where: { deletedAt: null },
            include: {
                providers: { select: { provider: true, email: true } },
                _count: { select: { plots: true, activities: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        const csvData = users.map(u => ({
            ID: u.id,
            ชื่อที่แสดง: u.displayName || '',
            ชื่อ: u.firstName || '',
            นามสกุล: u.lastName || '',
            อีเมล: u.providers.find(p => p.email)?.email || '',
            Provider: u.providers.map(p => p.provider).join(', '),
            จำนวนแปลง: u._count.plots,
            จำนวนกิจกรรม: u._count.activities,
            วันที่สมัคร: u.createdAt.toISOString(),
        }));

        return {
            data: csvData,
            filename: `users_export_${new Date().toISOString().split('T')[0]}.csv`,
        };
    }

    @Get('recent-activities')
    @ApiOperation({ summary: 'ดึงกิจกรรมล่าสุด' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getRecentActivities(@Query('limit') limit: string = '10') {
        const limitNum = parseInt(limit) || 10;

        const activities = await this.base.prisma.activity.findMany({
            where: { deletedAt: null },
            take: limitNum,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, displayName: true, pictureUrl: true },
                },
                plot: {
                    select: { id: true, name: true },
                },
            },
        });

        return activities.map(a => ({
            id: a.id,
            type: a.type,
            amount: a.amount,
            description: a.description,
            date: a.date,
            createdAt: a.createdAt,
            user: a.user,
            plot: a.plot,
        }));
    }
}
