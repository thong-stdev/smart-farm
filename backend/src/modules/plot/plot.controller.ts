import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, Ip } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PlotService, CreatePlotDto, UpdatePlotDto } from './plot.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@ApiTags('แปลงเกษตร')
@Controller('plots')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlotController {
    constructor(
        private readonly plotService: PlotService,
        private readonly prisma: PrismaService,
        private readonly auditLogService: AuditLogService,
    ) { }

    @Post()
    @ApiOperation({ summary: 'สร้างแปลงใหม่' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['name', 'size'],
            properties: {
                name: { type: 'string', example: 'แปลง A' },
                size: { type: 'number', example: 10.5, description: 'ขนาดเป็นไร่' },
                lat: { type: 'number', example: 13.7563 },
                lng: { type: 'number', example: 100.5018 },
                image: { type: 'string', example: 'https://...' },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'สร้างแปลงสำเร็จ' })
    async create(@Request() req: any, @Body() dto: CreatePlotDto, @Ip() ip: string) {
        const result = await this.plotService.create(req.user.sub, dto);

        await this.auditLogService.log({
            actorType: 'USER',
            actorId: req.user.sub,
            action: 'CREATE',
            target: 'Plot',
            targetId: result.id,
            data: { name: dto.name, size: dto.size },
            ip,
        });

        return result;
    }

    @Get()
    @ApiOperation({ summary: 'ดึงรายการแปลงทั้งหมดของผู้ใช้' })
    async findAll(@Request() req: any) {
        return this.plotService.findAllByUser(req.user.sub);
    }

    @Get(':id')
    @ApiOperation({ summary: 'ดึงข้อมูลแปลงตาม ID' })
    @ApiParam({ name: 'id', description: 'รหัสแปลง' })
    async findById(@Param('id') id: string, @Request() req: any) {
        return this.plotService.findById(id, req.user.sub);
    }

    @Get(':id/stats')
    @ApiOperation({ summary: 'ดึงสถิติแปลง' })
    @ApiParam({ name: 'id', description: 'รหัสแปลง' })
    async getStats(@Param('id') id: string, @Request() req: any) {
        return this.plotService.getPlotStats(id, req.user.sub);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'แก้ไขข้อมูลแปลง' })
    @ApiParam({ name: 'id', description: 'รหัสแปลง' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string', example: 'แปลง A (แก้ไข)' },
                size: { type: 'number', example: 12 },
                status: { type: 'string', enum: ['NORMAL', 'INACTIVE', 'ARCHIVED'] },
                lat: { type: 'number' },
                lng: { type: 'number' },
                image: { type: 'string' },
            },
        },
    })
    async update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdatePlotDto, @Ip() ip: string) {
        const result = await this.plotService.update(id, req.user.sub, dto);

        await this.auditLogService.log({
            actorType: 'USER',
            actorId: req.user.sub,
            action: 'UPDATE',
            target: 'Plot',
            targetId: id,
            data: dto,
            ip,
        });

        return result;
    }

    @Delete(':id')
    @ApiOperation({ summary: 'ลบแปลง' })
    @ApiParam({ name: 'id', description: 'รหัสแปลง' })
    async delete(@Param('id') id: string, @Request() req: any, @Ip() ip: string) {
        const result = await this.plotService.softDelete(id, req.user.sub);

        await this.auditLogService.log({
            actorType: 'USER',
            actorId: req.user.sub,
            action: 'DELETE',
            target: 'Plot',
            targetId: id,
            ip,
        });

        return result;
    }

    // ==================== FARM MEMBERS ====================

    @Get(':id/members')
    @ApiOperation({ summary: 'ดึงรายชื่อสมาชิกในแปลง' })
    @ApiParam({ name: 'id', description: 'รหัสแปลง' })
    async getMembers(@Param('id') plotId: string, @Request() req: any) {
        const plot = await this.prisma.plot.findFirst({
            where: { id: plotId, userId: req.user.sub },
        });
        if (!plot) {
            throw new Error('ไม่พบแปลงหรือไม่มีสิทธิ์เข้าถึง');
        }

        return this.prisma.farmMember.findMany({
            where: { plotId },
            include: {
                user: { select: { id: true, displayName: true, pictureUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    @Post(':id/members')
    @ApiOperation({ summary: 'เพิ่มสมาชิกในแปลง' })
    @ApiParam({ name: 'id', description: 'รหัสแปลง' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['userId', 'role'],
            properties: {
                userId: { type: 'string', description: 'รหัสผู้ใช้ที่ต้องการเพิ่ม' },
                role: { type: 'string', enum: ['OWNER', 'EDITOR', 'VIEWER'] },
            },
        },
    })
    async addMember(
        @Param('id') plotId: string,
        @Request() req: any,
        @Body() body: { userId: string; role: 'OWNER' | 'EDITOR' | 'VIEWER' },
        @Ip() ip: string,
    ) {
        const plot = await this.prisma.plot.findFirst({
            where: { id: plotId, userId: req.user.sub },
        });
        if (!plot) {
            throw new Error('ไม่พบแปลงหรือไม่มีสิทธิ์เพิ่มสมาชิก');
        }

        const result = await this.prisma.farmMember.create({
            data: {
                plotId,
                userId: body.userId,
                role: body.role,
            },
            include: {
                user: { select: { id: true, displayName: true, pictureUrl: true } },
            },
        });

        await this.auditLogService.log({
            actorType: 'USER',
            actorId: req.user.sub,
            action: 'ADD_MEMBER',
            target: 'FarmMember',
            targetId: result.id,
            data: { plotId, userId: body.userId, role: body.role },
            ip,
        });

        return result;
    }

    @Patch(':id/members/:memberId')
    @ApiOperation({ summary: 'แก้ไขบทบาทสมาชิก' })
    @ApiParam({ name: 'id', description: 'รหัสแปลง' })
    @ApiParam({ name: 'memberId', description: 'รหัสสมาชิก' })
    async updateMemberRole(
        @Param('id') plotId: string,
        @Param('memberId') memberId: string,
        @Request() req: any,
        @Body() body: { role: 'OWNER' | 'EDITOR' | 'VIEWER' },
        @Ip() ip: string,
    ) {
        const plot = await this.prisma.plot.findFirst({
            where: { id: plotId, userId: req.user.sub },
        });
        if (!plot) {
            throw new Error('ไม่พบแปลงหรือไม่มีสิทธิ์แก้ไข');
        }

        const result = await this.prisma.farmMember.update({
            where: { id: memberId },
            data: { role: body.role },
        });

        await this.auditLogService.log({
            actorType: 'USER',
            actorId: req.user.sub,
            action: 'UPDATE_MEMBER_ROLE',
            target: 'FarmMember',
            targetId: memberId,
            data: { role: body.role },
            ip,
        });

        return result;
    }

    @Delete(':id/members/:memberId')
    @ApiOperation({ summary: 'ลบสมาชิกออกจากแปลง' })
    @ApiParam({ name: 'id', description: 'รหัสแปลง' })
    @ApiParam({ name: 'memberId', description: 'รหัสสมาชิก' })
    async removeMember(
        @Param('id') plotId: string,
        @Param('memberId') memberId: string,
        @Request() req: any,
        @Ip() ip: string,
    ) {
        const plot = await this.prisma.plot.findFirst({
            where: { id: plotId, userId: req.user.sub },
        });
        if (!plot) {
            throw new Error('ไม่พบแปลงหรือไม่มีสิทธิ์ลบสมาชิก');
        }

        const result = await this.prisma.farmMember.delete({
            where: { id: memberId },
        });

        await this.auditLogService.log({
            actorType: 'USER',
            actorId: req.user.sub,
            action: 'REMOVE_MEMBER',
            target: 'FarmMember',
            targetId: memberId,
            ip,
        });

        return result;
    }
}
