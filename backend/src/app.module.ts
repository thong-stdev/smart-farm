import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { PlotModule } from './modules/plot/plot.module';
import { CropCycleModule } from './modules/crop-cycle/crop-cycle.module';
import { ActivityModule } from './modules/activity/activity.module';
import { ProductModule } from './modules/product/product.module';
import { UserProductModule } from './modules/user-product/user-product.module';
import { AiModule } from './modules/ai/ai.module';
import { AdminModule } from './modules/admin/admin.module';
import { CropPlanModule } from './modules/crop-plan/crop-plan.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportModule } from './modules/report/report.module';
import { NotificationModule } from './modules/notification/notification.module';
import { UploadModule } from './modules/upload/upload.module';
import { WeatherModule } from './modules/weather/weather.module';
import { LineBotModule } from './modules/line-bot/line-bot.module';
import { JobModule } from './jobs/job.module';
import { CropTypeModule } from './modules/crop-type/crop-type.module';

import { HealthController } from './health.controller';

@Module({
    imports: [
        // ตั้งค่า Environment Variables
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        // Common Services
        CommonModule,
        // Prisma Database
        PrismaModule,
        // Modules
        AuthModule,
        UserModule,
        PlotModule,
        CropCycleModule,
        ActivityModule,
        ProductModule,
        UserProductModule,
        AiModule,
        AdminModule,
        CropPlanModule,
        AuditLogModule,
        DashboardModule,
        ReportModule,
        NotificationModule,
        UploadModule,
        WeatherModule,
        LineBotModule,
        // Background Job System
        JobModule,
        CropTypeModule,
    ],
    controllers: [HealthController],
})

export class AppModule { }


