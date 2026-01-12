import { Module } from '@nestjs/common';
import { CropPlanController } from './crop-plan.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
    imports: [AuditLogModule],
    controllers: [CropPlanController],
})
export class CropPlanModule { }
