import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Ip, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminBaseService } from './admin-base.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as bcrypt from 'bcrypt';

/**
 * AdminSystemController - จัดการ Admin Users, Notifications, Backup, Media
 */
@ApiTags('Admin - System')
@Controller('admin')
@ApiBearerAuth()
export class AdminSystemController {
    constructor(private readonly base: AdminBaseService) { }

    // ==================== ADMIN USERS ====================

    @Get('admins')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'ดึงรายชื่อ Admin ทั้งหมด' })
    async getAdmins() {
        const admins = await this.base.prisma.admin.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
            },
        });
        return admins;
    }

    @Post('admins')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'สร้าง Admin ใหม่' })
    async createAdmin(
        @Body() body: {
            username: string;
            password: string;
            email?: string;
            name?: string;
            role?: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
        },
        @Request() req: any,
        @Ip() ip: string,
    ) {
        const hashedPassword = await bcrypt.hash(body.password, 10);

        const admin = await this.base.prisma.admin.create({
            data: {
                username: body.username,
                password: hashedPassword,
                email: body.email,
                name: body.name,
                role: body.role || 'ADMIN',
            },
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });

        await this.base.logAction('CREATE', 'Admin', admin.id, { username: body.username }, ip, req.user?.sub);

        return admin;
    }

    @Patch('admins/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'แก้ไข Admin' })
    async updateAdmin(
        @Param('id') id: string,
        @Body() body: {
            email?: string;
            name?: string;
            password?: string;
            role?: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
        },
        @Request() req: any,
        @Ip() ip: string,
    ) {
        const data: any = {};
        if (body.email !== undefined) data.email = body.email;
        if (body.name !== undefined) data.name = body.name;
        if (body.role !== undefined) data.role = body.role;
        if (body.password) {
            data.password = await bcrypt.hash(body.password, 10);
        }

        const admin = await this.base.prisma.admin.update({
            where: { id },
            data,
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });

        await this.base.logAction('UPDATE', 'Admin', id, { updated: Object.keys(data) }, ip, req.user?.sub);

        return admin;
    }

    @Patch('admins/:id/status')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'เปลี่ยนสถานะ Admin' })
    async updateAdminStatus(
        @Param('id') id: string,
        @Body() body: { isActive: boolean },
        @Request() req: any,
        @Ip() ip: string,
    ) {
        const admin = await this.base.prisma.admin.update({
            where: { id },
            data: { isActive: body.isActive },
        });

        await this.base.logAction(body.isActive ? 'ACTIVATE_ADMIN' : 'SUSPEND_ADMIN', 'Admin', id, body, ip, req.user?.sub);

        return { success: true, isActive: admin.isActive };
    }

    @Delete('admins/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'ลบ Admin' })
    async deleteAdmin(@Param('id') id: string, @Request() req: any, @Ip() ip: string) {
        await this.base.prisma.admin.delete({ where: { id } });
        await this.base.logAction('DELETE', 'Admin', id, null, ip, req.user?.sub);
        return { success: true };
    }

    // ==================== NOTIFICATIONS ====================

    @Get('notifications')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'ดึงรายการแจ้งเตือนระบบ' })
    async getNotifications() {
        const notifications = await this.base.prisma.systemNotification.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                _count: { select: { targets: true, reads: true } },
            },
        });

        return notifications.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            target: n.target,
            targetCount: n._count.targets,
            readCount: n._count.reads,
            totalSent: n._count.targets,
            sentAt: n.createdAt,
        }));
    }

    @Post('notifications')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'ส่งแจ้งเตือนใหม่' })
    async sendNotification(
        @Body() body: {
            title: string;
            message: string;
            type?: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
            target: 'ALL' | 'SPECIFIC';
            targetUserIds?: string[];
        },
        @Request() req: any,
        @Ip() ip: string,
    ) {
        // Create notification
        const notification = await this.base.prisma.systemNotification.create({
            data: {
                title: body.title,
                message: body.message,
                type: body.type || 'INFO',
                target: body.target,
            },
        });

        // Get target users
        let userIds: string[] = [];
        if (body.target === 'ALL') {
            const users = await this.base.prisma.user.findMany({
                where: { deletedAt: null },
                select: { id: true },
            });
            userIds = users.map(u => u.id);
        } else if (body.targetUserIds && body.targetUserIds.length > 0) {
            userIds = body.targetUserIds;
        }

        // Create notification targets
        if (userIds.length > 0) {
            await this.base.prisma.notificationTarget.createMany({
                data: userIds.map(userId => ({
                    notificationId: notification.id,
                    userId,
                })),
            });
        }

        await this.base.logAction('SEND_NOTIFICATION', 'SystemNotification', notification.id,
            { title: body.title, targetCount: userIds.length }, ip, req.user?.sub);

        return { success: true, sentCount: userIds.length };
    }

    @Delete('notifications/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'ลบแจ้งเตือน' })
    async deleteNotification(@Param('id') id: string, @Request() req: any, @Ip() ip: string) {
        await this.base.prisma.systemNotification.delete({ where: { id } });
        await this.base.logAction('DELETE', 'SystemNotification', id, null, ip, req.user?.sub);
        return { success: true };
    }

    // ==================== BACKUP ====================

    @Get('backup/stats')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'สถิติข้อมูลสำหรับ Backup' })
    async getBackupStats() {
        const [users, plots, activities, products, cropCycles] = await Promise.all([
            this.base.prisma.user.count({ where: { deletedAt: null } }),
            this.base.prisma.plot.count({ where: { deletedAt: null } }),
            this.base.prisma.activity.count({ where: { deletedAt: null } }),
            this.base.prisma.product.count(),
            this.base.prisma.cropCycle.count(),
        ]);

        return {
            users,
            plots,
            activities,
            products,
            cropCycles,
            lastBackup: null, // TODO: Track last backup
            dbSize: 'N/A', // TODO: Calculate DB size
        };
    }

    @Get('backup/export')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Export ข้อมูลทั้งหมด' })
    async exportBackup(@Request() req: any, @Ip() ip: string) {
        const [users, plots, activities, products, cropTypes, productCategories] = await Promise.all([
            this.base.prisma.user.findMany({
                where: { deletedAt: null },
                select: {
                    id: true,
                    displayName: true,
                    firstName: true,
                    lastName: true,
                    createdAt: true,
                },
            }),
            this.base.prisma.plot.findMany({
                where: { deletedAt: null },
                select: {
                    id: true,
                    name: true,
                    size: true,
                    userId: true,
                    createdAt: true,
                },
            }),
            this.base.prisma.activity.findMany({
                where: { deletedAt: null },
                select: {
                    id: true,
                    type: true,
                    amount: true,
                    description: true,
                    date: true,
                    userId: true,
                    plotId: true,
                },
            }),
            this.base.prisma.product.findMany(),
            this.base.prisma.cropType.findMany({
                include: { varieties: true },
            }),
            this.base.prisma.productCategory.findMany({
                include: { types: true },
            }),
        ]);

        await this.base.logAction('EXPORT_BACKUP', 'System', 'backup',
            { userCount: users.length, plotCount: plots.length }, ip, req.user?.sub);

        return {
            exportedAt: new Date().toISOString(),
            version: '1.0',
            data: {
                users,
                plots,
                activities,
                products,
                cropTypes,
                productCategories,
            },
        };
    }

    // ==================== MEDIA ====================

    @Get('media')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'ดึงรายการไฟล์ทั้งหมด' })
    async getMediaFiles() {
        const files = await this.base.prisma.mediaFile.findMany({
            orderBy: { createdAt: 'desc' },
            take: 200,
        });

        return files.map(f => ({
            id: f.id,
            filename: f.filename,
            originalName: f.originalName,
            mimetype: f.mimetype,
            size: f.size,
            url: f.url,
            uploadedBy: f.uploadedById,
            createdAt: f.createdAt,
        }));
    }

    @Delete('media/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'ลบไฟล์' })
    async deleteMediaFile(@Param('id') id: string, @Request() req: any, @Ip() ip: string) {
        const file = await this.base.prisma.mediaFile.findUnique({ where: { id } });
        if (!file) {
            return { error: 'File not found' };
        }

        await this.base.prisma.mediaFile.delete({ where: { id } });

        // TODO: Also delete physical file from storage

        await this.base.logAction('DELETE', 'MediaFile', id, { filename: file.filename }, ip, req.user?.sub);

        return { success: true };
    }
}
