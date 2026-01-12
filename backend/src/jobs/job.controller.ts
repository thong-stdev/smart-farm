import { Controller, Get, Param, Query } from '@nestjs/common';
import { JobService } from './job.service';

@Controller('admin/jobs')
export class JobController {
    constructor(private jobService: JobService) { }

    /**
     * ดึงรายการ Jobs ทั้งหมด
     */
    @Get()
    async getJobs(
        @Query('status') status?: string,
        @Query('type') type?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.jobService.getJobs({
            status,
            type,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
    }

    /**
     * ดึงสถานะ Job
     */
    @Get(':id')
    async getJobStatus(@Param('id') id: string) {
        return this.jobService.getJobStatus(id);
    }

    /**
     * ดึงสรุปสถิติ Jobs
     */
    @Get('stats/summary')
    async getJobStats() {
        const [pending, running, completed, failed] = await Promise.all([
            this.jobService['prisma'].backgroundJob.count({ where: { status: 'PENDING' } }),
            this.jobService['prisma'].backgroundJob.count({ where: { status: 'RUNNING' } }),
            this.jobService['prisma'].backgroundJob.count({ where: { status: 'COMPLETED' } }),
            this.jobService['prisma'].backgroundJob.count({ where: { status: 'FAILED' } }),
        ]);

        return { pending, running, completed, failed };
    }
}
