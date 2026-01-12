import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../common/prisma/prisma.module';
import { JobService } from './job.service';
import { JobWorkerService } from './job-worker.service';
import { JobController } from './job.controller';
import { NotificationModule } from '../modules/notification/notification.module';

@Module({
    imports: [
        PrismaModule,
        ScheduleModule.forRoot(),
        NotificationModule,
    ],
    controllers: [JobController],
    providers: [JobService, JobWorkerService],
    exports: [JobService],
})
export class JobModule { }
