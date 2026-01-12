import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Ip, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('แผนการปลูก')
@Controller('crop-plans')
@ApiBearerAuth()
export class CropPlanController {
    constructor(
        private prisma: PrismaService,
        private auditLogService: AuditLogService,
    ) { }

    /**
     * ดึงแผนการปลูกทั้งหมด
     */
    @Get()
    @ApiOperation({ summary: 'ดึงแผนการปลูกทั้งหมด' })
    @ApiQuery({ name: 'search', required: false, type: String })
    async getAll(@Query('search') search?: string) {
        const where: any = {};
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        const plans = await this.prisma.cropPlan.findMany({
            where,
            include: {
                _count: { select: { stages: true, cropCycles: true } },
                varieties: {
                    select: { id: true, name: true, cropType: { select: { name: true } } },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return plans.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            stageCount: p._count.stages,
            cycleCount: p._count.cropCycles,
            varieties: p.varieties,
            createdAt: p.createdAt,
        }));
    }

    /**
     * ดึงแผนการปลูกพร้อม stages
     */
    @Get(':id')
    @ApiOperation({ summary: 'ดึงแผนการปลูกพร้อม stages' })
    async getById(@Param('id') id: string) {
        const plan = await this.prisma.cropPlan.findUnique({
            where: { id },
            include: {
                stages: {
                    orderBy: { dayStart: 'asc' },
                },
                varieties: {
                    include: { cropType: true },
                },
                cropCycles: {
                    include: { plot: { select: { id: true, name: true } } },
                    take: 10,
                },
            },
        });

        return plan;
    }

    /**
     * สร้างแผนการปลูกใหม่
     */
    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'สร้างแผนการปลูกใหม่' })
    async create(
        @Body() body: { name: string; description?: string; varietyIds?: string[] },
        @Request() req: any,
        @Ip() ip: string,
    ) {
        const result = await this.prisma.cropPlan.create({
            data: {
                name: body.name,
                description: body.description,
                varieties: body.varietyIds ? {
                    connect: body.varietyIds.map(id => ({ id })),
                } : undefined,
            },
            include: { varieties: true },
        });

        await this.auditLogService.log({
            actorType: 'ADMIN',
            actorId: req?.user?.sub || null,
            action: 'CREATE',
            target: 'CropPlan',
            targetId: result.id,
            data: { name: body.name },
            ip,
        });

        return result;
    }

    /**
     * แก้ไขแผนการปลูก
     */
    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'แก้ไขแผนการปลูก' })
    async update(
        @Param('id') id: string,
        @Body() body: { name?: string; description?: string; varietyIds?: string[] },
        @Request() req: any,
        @Ip() ip: string,
    ) {
        const data: any = {};
        if (body.name !== undefined) data.name = body.name;
        if (body.description !== undefined) data.description = body.description;
        if (body.varietyIds) {
            data.varieties = {
                set: body.varietyIds.map(id => ({ id })),
            };
        }

        const result = await this.prisma.cropPlan.update({
            where: { id },
            data,
            include: { varieties: true },
        });

        await this.auditLogService.log({
            actorType: 'ADMIN',
            actorId: req?.user?.sub || null,
            action: 'UPDATE',
            target: 'CropPlan',
            targetId: id,
            data: body,
            ip,
        });

        return result;
    }

    /**
     * ลบแผนการปลูก
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'ลบแผนการปลูก' })
    async delete(@Param('id') id: string, @Request() req: any, @Ip() ip: string) {
        const result = await this.prisma.cropPlan.delete({ where: { id } });

        await this.auditLogService.log({
            actorType: 'ADMIN',
            actorId: req?.user?.sub || null,
            action: 'DELETE',
            target: 'CropPlan',
            targetId: id,
            ip,
        });

        return result;
    }

    // ==================== PLAN STAGES ====================

    /**
     * เพิ่ม stage ในแผน
     */
    @Post(':id/stages')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'เพิ่ม stage ในแผน' })
    async addStage(
        @Param('id') planId: string,
        @Body() body: { stageName: string; dayStart: number; dayEnd?: number; action: string; method: string; reason: string },
        @Request() req: any,
        @Ip() ip: string,
    ) {
        const result = await this.prisma.planStage.create({
            data: {
                planId,
                stageName: body.stageName,
                dayStart: body.dayStart,
                dayEnd: body.dayEnd,
                action: body.action,
                method: body.method,
                reason: body.reason,
            },
        });

        await this.auditLogService.log({
            actorType: 'ADMIN',
            actorId: req?.user?.sub || null,
            action: 'CREATE',
            target: 'PlanStage',
            targetId: result.id,
            data: { planId, stageName: body.stageName },
            ip,
        });

        return result;
    }

    /**
     * แก้ไข stage
     */
    @Patch('stages/:stageId')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'แก้ไข stage' })
    async updateStage(
        @Param('stageId') stageId: string,
        @Body() body: { stageName?: string; dayStart?: number; dayEnd?: number; action?: string; method?: string; reason?: string },
        @Request() req: any,
        @Ip() ip: string,
    ) {
        const result = await this.prisma.planStage.update({
            where: { id: stageId },
            data: body,
        });

        await this.auditLogService.log({
            actorType: 'ADMIN',
            actorId: req?.user?.sub || null,
            action: 'UPDATE',
            target: 'PlanStage',
            targetId: stageId,
            data: body,
            ip,
        });

        return result;
    }

    /**
     * ลบ stage
     */
    @Delete('stages/:stageId')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'ลบ stage' })
    async deleteStage(@Param('stageId') stageId: string, @Request() req: any, @Ip() ip: string) {
        const result = await this.prisma.planStage.delete({ where: { id: stageId } });

        await this.auditLogService.log({
            actorType: 'ADMIN',
            actorId: req?.user?.sub || null,
            action: 'DELETE',
            target: 'PlanStage',
            targetId: stageId,
            ip,
        });

        return result;
    }
}
