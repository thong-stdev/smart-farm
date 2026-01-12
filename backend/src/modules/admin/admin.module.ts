import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';

// Base Service (shared)
import { AdminBaseService } from './admin-base.service';

// Controllers (แยกตามหน้าที่)
import { AdminUserController } from './admin-user.controller';
import { AdminProductController } from './admin-product.controller';
import { AdminPromotionController } from './admin-promotion.controller';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminSystemController } from './admin-system.controller';

@Module({
    imports: [AuditLogModule],
    controllers: [
        AdminUserController,
        AdminProductController,
        AdminPromotionController,
        AdminAnalyticsController,
        AdminSettingsController,
        AdminSystemController,
    ],
    providers: [AdminBaseService],
})
export class AdminModule { }
