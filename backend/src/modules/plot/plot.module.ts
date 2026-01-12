import { Module, forwardRef } from '@nestjs/common';
import { PlotController } from './plot.controller';
import { PlotService } from './plot.service';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { JobModule } from '../../jobs/job.module';

@Module({
    imports: [
        AuditLogModule,
        forwardRef(() => JobModule),
    ],
    controllers: [PlotController],
    providers: [PlotService],
    exports: [PlotService],
})
export class PlotModule { }
