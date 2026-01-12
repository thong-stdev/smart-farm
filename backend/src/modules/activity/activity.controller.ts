import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, Ip } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ActivityService, CreateActivityDto, UpdateActivityDto, ActivityFilterDto } from './activity.service';
import { ActivityAIService } from './activity-ai.service'; // [NEW]
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActivityType } from '@prisma/client';
import { AuditLogService } from '../audit-log/audit-log.service';

@ApiTags('กิจกรรม')
@Controller('activities')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ActivityController {
    constructor(
        private readonly activityService: ActivityService,
        private readonly activityAiService: ActivityAIService, // [NEW]
        private readonly auditLogService: AuditLogService,
    ) { }

    @Post('parse')
    @ApiOperation({ summary: 'วิเคราะห์กิจกรรมจากข้อความ' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['text'],
            properties: {
                text: { type: 'string', example: 'ซื้อปุ๋ย 2 กระสอบ 1500 บาท' },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'วิเคราะห์กิจกรรมสำเร็จ' })
    async parseActivity(@Body('text') text: string) {
        return this.activityAiService.parseActivity(text);
    }

    @Post()
    @ApiOperation({ summary: 'บันทึกกิจกรรมใหม่' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['type'],
            properties: {
                type: { type: 'string', enum: ['INCOME', 'EXPENSE', 'PLANTING', 'GENERAL'], example: 'EXPENSE' },
                amount: { type: 'number', example: 1500 },
                description: { type: 'string', example: 'ซื้อปุ๋ยยูเรีย 2 กระสอบ' },
                date: { type: 'string', format: 'date-time' },
                plotId: { type: 'string' },
                cropCycleId: { type: 'string' },
                categoryId: { type: 'string' },
                productId: { type: 'string' },
                quantity: { type: 'number', example: 2 },
                unit: { type: 'string', example: 'กระสอบ' },
                unitPrice: { type: 'number', example: 750 },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'บันทึกกิจกรรมสำเร็จ' })
    async create(@Request() req: any, @Body() dto: CreateActivityDto, @Ip() ip: string) {
        const result = await this.activityService.create(req.user.sub, dto);

        await this.auditLogService.log({
            actorType: 'USER',
            actorId: req.user.sub,
            action: 'CREATE',
            target: 'Activity',
            targetId: result.id,
            data: { type: dto.type, amount: dto.amount, plotId: dto.plotId },
            ip,
        });

        return result;
    }

    @Get('categories')
    @ApiOperation({ summary: 'ดึงรายการหมวดหมู่กิจกรรม' })
    async getCategories() {
        return this.activityService.findAllCategories();
    }

    @Get()
    @ApiOperation({ summary: 'ดึงรายการกิจกรรม' })
    @ApiQuery({ name: 'type', required: false, enum: ['INCOME', 'EXPENSE', 'PLANTING', 'GENERAL'] })
    @ApiQuery({ name: 'plotId', required: false })
    @ApiQuery({ name: 'cropCycleId', required: false })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async findAll(
        @Request() req: any,
        @Query('type') type?: ActivityType,
        @Query('plotId') plotId?: string,
        @Query('cropCycleId') cropCycleId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const filter: ActivityFilterDto = {
            type,
            plotId,
            cropCycleId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        };
        return this.activityService.findAll(req.user.sub, filter);
    }

    @Get('summary')
    @ApiOperation({ summary: 'สรุปกิจกรรม (รายรับ/รายจ่าย/กำไร)' })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    async getSummary(
        @Request() req: any,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.activityService.getSummary(
            req.user.sub,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
        );
    }

    @Get('summary/plots')
    @ApiOperation({ summary: 'สรุปกิจกรรมแยกตามแปลง' })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    async getPlotSummary(
        @Request() req: any,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.activityService.getPlotSummary(
            req.user.sub,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
        );
    }

    @Get(':id')
    @ApiOperation({ summary: 'ดึงข้อมูลกิจกรรมตาม ID' })
    @ApiParam({ name: 'id', description: 'รหัสกิจกรรม' })
    async findById(@Param('id') id: string, @Request() req: any) {
        return this.activityService.findById(id, req.user.sub);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'แก้ไขกิจกรรม' })
    @ApiParam({ name: 'id', description: 'รหัสกิจกรรม' })
    async update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateActivityDto, @Ip() ip: string) {
        const result = await this.activityService.update(id, req.user.sub, dto);

        await this.auditLogService.log({
            actorType: 'USER',
            actorId: req.user.sub,
            action: 'UPDATE',
            target: 'Activity',
            targetId: id,
            data: dto,
            ip,
        });

        return result;
    }

    @Delete(':id')
    @ApiOperation({ summary: 'ลบกิจกรรม' })
    @ApiParam({ name: 'id', description: 'รหัสกิจกรรม' })
    async delete(@Param('id') id: string, @Request() req: any, @Ip() ip: string) {
        const result = await this.activityService.softDelete(id, req.user.sub);

        await this.auditLogService.log({
            actorType: 'USER',
            actorId: req.user.sub,
            action: 'DELETE',
            target: 'Activity',
            targetId: id,
            ip,
        });

        return result;
    }
}
