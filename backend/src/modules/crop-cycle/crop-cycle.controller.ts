import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, Ip } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CropCycleService, CreateCropCycleDto, UpdateCropCycleDto } from './crop-cycle.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditLogService } from '../audit-log/audit-log.service';

@ApiTags('รอบการปลูก')
@Controller('crop-cycles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CropCycleController {
    constructor(
        private readonly cropCycleService: CropCycleService,
        private readonly auditLogService: AuditLogService,
    ) { }

    @Post()
    @ApiOperation({ summary: 'สร้างรอบการปลูกใหม่' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['plotId'],
            properties: {
                plotId: { type: 'string', description: 'รหัสแปลง' },
                cropType: { type: 'string', example: 'ข้าว' },
                cropVarietyId: { type: 'string' },
                startDate: { type: 'string', format: 'date-time' },
                note: { type: 'string' },
                planId: { type: 'string' },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'สร้างรอบการปลูกสำเร็จ' })
    async create(@Request() req: any, @Body() dto: CreateCropCycleDto, @Ip() ip: string) {
        const result = await this.cropCycleService.create(req.user.sub, dto);

        await this.auditLogService.log({
            actorType: 'USER',
            actorId: req.user.sub,
            action: 'CREATE',
            target: 'CropCycle',
            targetId: result.id,
            data: { plotId: dto.plotId, cropType: dto.cropType, cropVarietyId: dto.cropVarietyId },
            ip,
        });

        return result;
    }

    @Get('plot/:plotId')
    @ApiOperation({ summary: 'ดึงรายการรอบการปลูกตามแปลง' })
    @ApiParam({ name: 'plotId', description: 'รหัสแปลง' })
    async findByPlot(@Param('plotId') plotId: string, @Request() req: any) {
        return this.cropCycleService.findByPlot(plotId, req.user.sub);
    }

    @Get(':id')
    @ApiOperation({ summary: 'ดึงข้อมูลรอบการปลูกตาม ID' })
    @ApiParam({ name: 'id', description: 'รหัสรอบการปลูก' })
    async findById(@Param('id') id: string, @Request() req: any) {
        return this.cropCycleService.findById(id, req.user.sub);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'แก้ไขรอบการปลูก' })
    @ApiParam({ name: 'id', description: 'รหัสรอบการปลูก' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                cropType: { type: 'string' },
                cropVarietyId: { type: 'string' },
                endDate: { type: 'string', format: 'date-time' },
                status: { type: 'string', enum: ['ACTIVE', 'COMPLETED'] },
                yield: { type: 'number', description: 'ผลผลิต' },
                note: { type: 'string' },
            },
        },
    })
    async update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateCropCycleDto, @Ip() ip: string) {
        const result = await this.cropCycleService.update(id, req.user.sub, dto);

        await this.auditLogService.log({
            actorType: 'USER',
            actorId: req.user.sub,
            action: 'UPDATE',
            target: 'CropCycle',
            targetId: id,
            data: dto,
            ip,
        });

        return result;
    }

    @Post(':id/complete')
    @ApiOperation({ summary: 'จบรอบการปลูก' })
    @ApiParam({ name: 'id', description: 'รหัสรอบการปลูก' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                yield: { type: 'number', description: 'ผลผลิต (กก.)' },
            },
        },
    })
    async complete(@Param('id') id: string, @Request() req: any, @Body() body: { yield?: number }, @Ip() ip: string) {
        const result = await this.cropCycleService.complete(id, req.user.sub, body.yield);

        await this.auditLogService.log({
            actorType: 'USER',
            actorId: req.user.sub,
            action: 'COMPLETE',
            target: 'CropCycle',
            targetId: id,
            data: { yield: body.yield },
            ip,
        });

        return result;
    }

    @Delete(':id')
    @ApiOperation({ summary: 'ลบรอบการปลูก' })
    @ApiParam({ name: 'id', description: 'รหัสรอบการปลูก' })
    async delete(@Param('id') id: string, @Request() req: any, @Ip() ip: string) {
        const result = await this.cropCycleService.softDelete(id, req.user.sub);

        await this.auditLogService.log({
            actorType: 'USER',
            actorId: req.user.sub,
            action: 'DELETE',
            target: 'CropCycle',
            targetId: id,
            ip,
        });

        return result;
    }
}
