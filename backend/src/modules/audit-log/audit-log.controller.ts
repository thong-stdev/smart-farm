import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditLogService, AuditActorType } from './audit-log.service';

@ApiTags('Audit Log')
@Controller('admin/audit-logs')
@ApiBearerAuth()
export class AuditLogController {
    constructor(private auditLogService: AuditLogService) { }

    @Get()
    @ApiOperation({ summary: 'ดึง Audit Logs (Admin)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'actorType', required: false, enum: ['USER', 'ADMIN', 'SYSTEM'] })
    @ApiQuery({ name: 'target', required: false, type: String })
    @ApiQuery({ name: 'action', required: false, type: String })
    async findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('actorType') actorType?: AuditActorType,
        @Query('target') target?: string,
        @Query('action') action?: string,
    ) {
        return this.auditLogService.findAll({
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            actorType,
            target,
            action,
        });
    }
}
