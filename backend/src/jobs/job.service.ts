import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface CreateJobDto {
    type: 'DELETE_PLOT' | 'DELETE_CROP_CYCLE' | 'DELETE_USER' | 'CLEANUP_ARCHIVE' | 'REBUILD_CACHE';
    payload: Record<string, any>;
    triggeredByUserId?: string;
    triggeredByAdminId?: string;
}

@Injectable()
export class JobService {
    private readonly logger = new Logger(JobService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * สร้าง Job ใหม่
     */
    async createJob(dto: CreateJobDto) {
        const job = await this.prisma.backgroundJob.create({
            data: {
                type: dto.type,
                payload: dto.payload as Prisma.InputJsonValue,
                triggeredByUserId: dto.triggeredByUserId,
                triggeredByAdminId: dto.triggeredByAdminId,
                status: 'PENDING',
            },
        });

        this.logger.log(`Created job ${job.id} of type ${dto.type}`);
        return job;
    }

    /**
     * ดึง Job ที่รอดำเนินการ
     */
    async getPendingJobs(limit = 10) {
        return this.prisma.backgroundJob.findMany({
            where: {
                status: 'PENDING',
                OR: [
                    { lockedAt: null },
                    { lockedAt: { lt: new Date(Date.now() - 5 * 60 * 1000) } }, // expired lock (5 min)
                ],
            },
            orderBy: { createdAt: 'asc' },
            take: limit,
        });
    }

    /**
     * Lock Job เพื่อป้องกัน race condition
     */
    async lockJob(jobId: string, workerId: string) {
        try {
            const job = await this.prisma.backgroundJob.updateMany({
                where: {
                    id: jobId,
                    status: 'PENDING',
                    OR: [
                        { lockedAt: null },
                        { lockedAt: { lt: new Date(Date.now() - 5 * 60 * 1000) } },
                    ],
                },
                data: {
                    lockedAt: new Date(),
                    lockedBy: workerId,
                },
            });
            return job.count > 0;
        } catch {
            return false;
        }
    }

    /**
     * เริ่มประมวลผล Job
     */
    async startJob(jobId: string) {
        return this.prisma.backgroundJob.update({
            where: { id: jobId },
            data: {
                status: 'RUNNING',
                startedAt: new Date(),
            },
        });
    }

    /**
     * Job สำเร็จ
     */
    async completeJob(jobId: string) {
        return this.prisma.backgroundJob.update({
            where: { id: jobId },
            data: {
                status: 'COMPLETED',
                finishedAt: new Date(),
                lockedAt: null,
                lockedBy: null,
            },
        });
    }

    /**
     * Job ล้มเหลว
     */
    async failJob(jobId: string, error: string) {
        const job = await this.prisma.backgroundJob.findUnique({
            where: { id: jobId },
        });

        if (!job) return null;

        const shouldRetry = job.retryCount < job.maxRetry;

        return this.prisma.backgroundJob.update({
            where: { id: jobId },
            data: {
                status: shouldRetry ? 'PENDING' : 'FAILED',
                lastError: error,
                lastErrorAt: new Date(),
                retryCount: job.retryCount + 1,
                lockedAt: null,
                lockedBy: null,
            },
        });
    }

    /**
     * บันทึก Log ของ Job
     */
    async logJob(jobId: string, level: string, message: string, data?: Record<string, any>) {
        return this.prisma.jobLog.create({
            data: {
                jobId,
                level,
                message,
                data: data as Prisma.InputJsonValue,
            },
        });
    }

    /**
     * อัพเดท Progress
     */
    async updateProgress(jobId: string, entity: string, processed: number, total?: number) {
        return this.prisma.jobProgress.upsert({
            where: { jobId_entity: { jobId, entity } },
            create: {
                jobId,
                entity,
                processed,
                total,
            },
            update: {
                processed,
                total,
            },
        });
    }

    /**
     * ดึงสถานะ Job
     */
    async getJobStatus(jobId: string) {
        return this.prisma.backgroundJob.findUnique({
            where: { id: jobId },
            include: {
                progress: true,
                logs: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
            },
        });
    }

    /**
     * ดึงรายการ Jobs (Admin)
     */
    async getJobs(options: {
        status?: string;
        type?: string;
        page?: number;
        limit?: number;
    }) {
        const { status, type, page = 1, limit = 20 } = options;

        const where: Prisma.BackgroundJobWhereInput = {};
        if (status) where.status = status as any;
        if (type) where.type = type as any;

        const [jobs, total] = await Promise.all([
            this.prisma.backgroundJob.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: { progress: true },
            }),
            this.prisma.backgroundJob.count({ where }),
        ]);

        return { jobs, total, page, limit };
    }
}
