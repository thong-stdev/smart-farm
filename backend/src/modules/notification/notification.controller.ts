import { Controller, Get, Post, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
    constructor(private notificationService: NotificationService) { }

    @Get()
    @ApiOperation({ summary: 'ดึงสรุปแจ้งเตือน' })
    async getSummary(@Request() req: any) {
        return this.notificationService.getNotificationSummary(req.user.sub);
    }

    @Get('today')
    @ApiOperation({ summary: 'ดึงกิจกรรมที่ต้องทำวันนี้' })
    async getTodayTasks(@Request() req: any) {
        return this.notificationService.getTodayTasks(req.user.sub);
    }

    @Get('upcoming')
    @ApiOperation({ summary: 'ดึงกิจกรรมที่ใกล้ถึง' })
    @ApiQuery({ name: 'days', required: false, type: Number, description: 'จำนวนวันล่วงหน้า (default: 7)' })
    async getUpcoming(
        @Request() req: any,
        @Query('days') days?: string,
    ) {
        return this.notificationService.getUpcomingTasks(
            req.user.sub,
            days ? parseInt(days) : 7,
        );
    }
    @Post('trigger')
    @ApiOperation({ summary: 'ทดสอบส่งแจ้งเตือน (Manual Trigger)' })
    async triggerNotifications(@Request() req: any) {
        return this.notificationService.sendDailyNotifications();
    }

    @Get('history')
    @ApiOperation({ summary: 'ดึงประวัติการแจ้งเตือน' })
    async getHistory(@Request() req: any) {
        return this.notificationService.getUserNotifications(req.user.sub);
    }

    @Post(':id/read') // ใช้ Post หรือ Patch ก็ได้ แต่ Post ง่ายกว่าสำหรับบาง client
    @ApiOperation({ summary: 'อ่านแจ้งเตือน' })
    async markRead(@Request() req: any, @Param('id') id: string) {
        return this.notificationService.markAsRead(req.user.sub, id);
    }

    @Post('read-all')
    @ApiOperation({ summary: 'อ่านทั้งหมด' })
    async markAllRead(@Request() req: any) {
        return this.notificationService.markAllAsRead(req.user.sub);
    }
}
