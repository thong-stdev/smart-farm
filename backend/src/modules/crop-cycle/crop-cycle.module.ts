import { Module } from '@nestjs/common';
import { CropCycleController } from './crop-cycle.controller';
import { CropCycleService } from './crop-cycle.service';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { JobModule } from '../../jobs/job.module';

@Module({
    imports: [AuditLogModule, JobModule],
    controllers: [CropCycleController],
    providers: [CropCycleService],
    exports: [CropCycleService],
})
export class CropCycleModule { }
