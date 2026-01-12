import { Controller, Get, Post, Patch, Delete, Param, Body, Ip, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminBaseService } from './admin-base.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * AdminSettingsController - จัดการ Settings และ Feature Flags
 */
@ApiTags('Admin - Settings')
@Controller('admin')
@ApiBearerAuth()
export class AdminSettingsController {
    constructor(private readonly base: AdminBaseService) { }

    // ==================== SYSTEM SETTINGS ====================

    @Get('settings')
    @ApiOperation({ summary: 'ดึงการตั้งค่าระบบ' })
    async getSettings() {
        let settings = await this.base.prisma.systemSettings.findUnique({
            where: { id: 'system' },
        });

        if (!settings) {
            settings = await this.base.prisma.systemSettings.create({
                data: { id: 'system' },
            });
        }

        // Mask secret fields และเพิ่ม hasValue flags
        const result: any = { ...settings };
        for (const field of this.base.secretFields) {
            if (result[field]) {
                result[`${field}_hasValue`] = true;
                result[field] = '••••••••';
            } else {
                result[`${field}_hasValue`] = false;
            }
        }

        return result;
    }

    @Patch('settings')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'อัปเดตการตั้งค่าระบบ' })
    async updateSettings(
        @Body() body: any,
        @Request() req: any,
        @Ip() ip: string,
    ) {
        // เข้ารหัส secret fields ก่อนบันทึก
        const dataToSave = { ...body };

        // ลบ _hasValue fields ออก
        for (const field of this.base.secretFields) {
            delete dataToSave[`${field}_hasValue`];
        }

        // เข้ารหัส secret fields (เฉพาะที่มีค่าจริงๆ ไม่ใช่ masked)
        for (const field of this.base.secretFields) {
            if (dataToSave[field] && dataToSave[field] !== '••••••••' && dataToSave[field].length > 0) {
                dataToSave[field] = this.base.encryptionService.encrypt(dataToSave[field]);
            } else if (dataToSave[field] === '••••••••') {
                // ถ้าเป็น masked value ให้ลบออกเพื่อไม่ต้อง update
                delete dataToSave[field];
            }
        }

        const settings = await this.base.prisma.systemSettings.upsert({
            where: { id: 'system' },
            update: dataToSave,
            create: { id: 'system', ...dataToSave },
        });

        // Log แต่ไม่รวม secret values
        const logData = { ...body };
        for (const field of this.base.secretFields) {
            if (logData[field]) logData[field] = '[ENCRYPTED]';
        }

        await this.base.logAction('UPDATE', 'SystemSettings', 'system', logData, ip, req.user?.sub);

        // Return masked version
        const result: any = { ...settings };
        for (const field of this.base.secretFields) {
            if (result[field]) {
                result[`${field}_hasValue`] = true;
                result[field] = '••••••••';
            } else {
                result[`${field}_hasValue`] = false;
            }
        }

        return result;
    }

    // ==================== FEATURE FLAGS ====================

    @Get('feature-flags')
    @ApiOperation({ summary: 'รายการ Feature Flags ทั้งหมด' })
    async getFeatureFlags() {
        return this.base.prisma.featureFlag.findMany({
            orderBy: { key: 'asc' },
        });
    }

    @Post('feature-flags')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'สร้าง Feature Flag ใหม่' })
    async createFeatureFlag(
        @Body() body: {
            key: string;
            enabled?: boolean;
            rollout?: number;
            metadata?: any;
        },
        @Request() req: any,
        @Ip() ip: string,
    ) {
        const flag = await this.base.prisma.featureFlag.create({
            data: {
                key: body.key,
                enabled: body.enabled ?? false,
                rollout: body.rollout,
                metadata: body.metadata,
            },
        });

        await this.base.logAction('CREATE', 'FeatureFlag', body.key, body, ip, req.user?.sub);

        return flag;
    }

    @Patch('feature-flags/:key')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'อัปเดต Feature Flag' })
    async updateFeatureFlag(
        @Param('key') key: string,
        @Body() body: {
            enabled?: boolean;
            rollout?: number;
            metadata?: any;
        },
        @Request() req: any,
        @Ip() ip: string,
    ) {
        const flag = await this.base.prisma.featureFlag.update({
            where: { key },
            data: body,
        });

        await this.base.logAction('UPDATE', 'FeatureFlag', key, body, ip, req.user?.sub);

        return flag;
    }

    @Delete('feature-flags/:key')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'ลบ Feature Flag' })
    async deleteFeatureFlag(
        @Param('key') key: string,
        @Request() req: any,
        @Ip() ip: string,
    ) {
        await this.base.prisma.featureFlag.delete({
            where: { key },
        });

        await this.base.logAction('DELETE', 'FeatureFlag', key, null, ip, req.user?.sub);

        return { message: 'ลบสำเร็จ' };
    }

    // ==================== AUDIT LOGS ====================

    @Get('audit-logs')
    @ApiOperation({ summary: 'ดึง Audit Logs' })
    async getAuditLogs(
        @Param('page') page: string = '1',
        @Param('limit') limit: string = '50',
    ) {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 50;
        const skip = (pageNum - 1) * limitNum;

        const [items, total] = await Promise.all([
            this.base.prisma.auditLog.findMany({
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum,
            }),
            this.base.prisma.auditLog.count(),
        ]);

        return {
            items,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        };
    }
}
