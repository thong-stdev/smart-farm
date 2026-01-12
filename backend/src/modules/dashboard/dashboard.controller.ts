import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
    constructor(private dashboardService: DashboardService) { }

    @Get('summary')
    @ApiOperation({ summary: 'สรุปภาพรวมของผู้ใช้' })
    async getSummary(@Request() req: any) {
        return this.dashboardService.getUserSummary(req.user.sub);
    }

    @Get('financial')
    @ApiOperation({ summary: 'สรุปรายได้-รายจ่าย' })
    @ApiQuery({ name: 'year', required: false, type: Number })
    @ApiQuery({ name: 'month', required: false, type: Number })
    async getFinancial(
        @Request() req: any,
        @Query('year') year?: string,
        @Query('month') month?: string,
    ) {
        return this.dashboardService.getFinancialSummary(
            req.user.sub,
            year ? parseInt(year) : undefined,
            month ? parseInt(month) : undefined,
        );
    }

    @Get('plots')
    @ApiOperation({ summary: 'สรุปแปลง' })
    async getPlots(@Request() req: any) {
        return this.dashboardService.getPlotsSummary(req.user.sub);
    }

    @Get('monthly-stats')
    @ApiOperation({ summary: 'สถิติรายเดือน' })
    @ApiQuery({ name: 'year', required: false, type: Number })
    async getMonthlyStats(
        @Request() req: any,
        @Query('year') year?: string,
    ) {
        return this.dashboardService.getMonthlyStats(
            req.user.sub,
            year ? parseInt(year) : undefined,
        );
    }
}
