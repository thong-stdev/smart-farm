import { Module } from '@nestjs/common';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { ActivityAIService } from './activity-ai.service';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
    imports: [AuditLogModule],
    controllers: [ActivityController],
    providers: [ActivityService, ActivityAIService],
    exports: [ActivityService, ActivityAIService],
})
export class ActivityModule { }
