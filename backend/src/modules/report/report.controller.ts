import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportController {
    constructor(private reportService: ReportService) { }

    @Get('monthly')
    @ApiOperation({ summary: 'รายงานประจำเดือน' })
    @ApiQuery({ name: 'year', required: true, type: Number })
    @ApiQuery({ name: 'month', required: true, type: Number })
    async getMonthlyReport(
        @Request() req: any,
        @Query('year') year: string,
        @Query('month') month: string,
    ) {
        return this.reportService.getMonthlyReport(
            req.user.sub,
            parseInt(year),
            parseInt(month),
        );
    }

    @Get('yearly')
    @ApiOperation({ summary: 'รายงานประจำปี' })
    @ApiQuery({ name: 'year', required: true, type: Number })
    async getYearlyReport(
        @Request() req: any,
        @Query('year') year: string,
    ) {
        return this.reportService.getYearlyReport(req.user.sub, parseInt(year));
    }

    @Get('crop-cycle/:id')
    @ApiOperation({ summary: 'รายงานรอบปลูก' })
    @ApiParam({ name: 'id', description: 'รหัสรอบปลูก' })
    async getCropCycleReport(
        @Request() req: any,
        @Param('id') cycleId: string,
    ) {
        return this.reportService.getCropCycleReport(req.user.sub, cycleId);
    }
}
