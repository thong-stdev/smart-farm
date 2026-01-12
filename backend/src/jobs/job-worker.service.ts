import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { JobService } from './job.service';
import { NotificationService } from '../modules/notification/notification.service';
import { v4 as uuidv4 } from 'uuid';

type BackgroundJob = {
    id: string;
    type: string;
    payload: any;
};

const BATCH_SIZE = 500;

@Injectable()
export class JobWorkerService implements OnModuleInit {
    private readonly logger = new Logger(JobWorkerService.name);
    private readonly workerId = `worker-${uuidv4().slice(0, 8)}`;
    private isProcessing = false;

    constructor(
        private prisma: PrismaService,
        private jobService: JobService,
        private notificationService: NotificationService,
    ) { }

    onModuleInit() {
        this.logger.log(`Worker ${this.workerId} initialized`);
    }

    /**
     * ทุกวัน เวลา 08:00
     */
    @Cron('0 8 * * *')
    async scheduleDailyNotifications() {
        this.logger.log('Scheduling daily notifications...');
        await this.jobService.createJob({
            type: 'DAILY_NOTIFICATION' as any,
            payload: {},
        });
    }

    /**
     * ทุก 10 วินาที ตรวจสอบและประมวลผล pending jobs
     */
    @Cron(CronExpression.EVERY_10_SECONDS)
    async processPendingJobs() {
        if (this.isProcessing) return;

        this.isProcessing = true;
        try {
            const jobs = await this.jobService.getPendingJobs(5);

            for (const job of jobs) {
                const locked = await this.jobService.lockJob(job.id, this.workerId);
                if (!locked) continue;

                await this.processJob(job);
            }
        } catch (error) {
            this.logger.error('Error processing jobs', error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * ประมวลผล Job ตาม Type
     */
    private async processJob(job: any) {
        this.logger.log(`Processing job ${job.id} of type ${job.type}`);

        try {
            await this.jobService.startJob(job.id);

            switch (job.type) {
                case 'DELETE_PLOT':
                    await this.processDeletePlot(job);
                    break;
                case 'DELETE_CROP_CYCLE':
                    await this.processDeleteCropCycle(job);
                    break;
                case 'DELETE_USER':
                    await this.processDeleteUser(job);
                    break;
                case 'CLEANUP_ARCHIVE':
                    await this.processCleanupArchive(job);
                    break;
                case 'DAILY_NOTIFICATION' as any:
                    await this.notificationService.sendDailyNotifications();
                    break;
                default:
                    throw new Error(`Unknown job type: ${job.type}`);
            }

            await this.jobService.completeJob(job.id);
            this.logger.log(`Job ${job.id} completed successfully`);
        } catch (error: any) {
            this.logger.error(`Job ${job.id} failed: ${error.message}`);
            await this.jobService.failJob(job.id, error.message);
        }
    }

    /**
     * ลบ Plot และข้อมูลที่เกี่ยวข้องทั้งหมด (Batch Delete)
     */
    private async processDeletePlot(job: any) {
        const payload = job.payload as { plotId: string };
        const { plotId } = payload;

        if (!plotId) throw new Error('plotId is required');

        // ลำดับการลบ (ลูกก่อน → แม่ทีหลัง)
        const deleteOrder = [
            { entity: 'ActivityImage', deleteFn: () => this.batchDeleteActivityImages(plotId, job.id) },
            { entity: 'Activity', deleteFn: () => this.batchDelete('activity', { plotId }, job.id) },
            { entity: 'AiRecommendation', deleteFn: () => this.batchDelete('aiRecommendation', { plotId }, job.id) },
            { entity: 'CropCycle', deleteFn: () => this.batchDelete('cropCycle', { plotId }, job.id) },
            { entity: 'WeatherSnapshot', deleteFn: () => this.batchDelete('weatherSnapshot', { plotId }, job.id) },
            { entity: 'SoilSnapshot', deleteFn: () => this.batchDelete('soilSnapshot', { plotId }, job.id) },
            { entity: 'PlotSummary', deleteFn: () => this.prisma.plotSummary.deleteMany({ where: { plotId } }) },
            { entity: 'FarmMember', deleteFn: () => this.batchDelete('farmMember', { plotId }, job.id) },
            { entity: 'Plot', deleteFn: () => this.prisma.plot.delete({ where: { id: plotId } }) },
        ];

        for (const step of deleteOrder) {
            await this.jobService.logJob(job.id, 'INFO', `Deleting ${step.entity}...`);

            try {
                await step.deleteFn();
                await this.jobService.logJob(job.id, 'INFO', `${step.entity} deleted`);
            } catch (error: any) {
                // PlotSummary/Plot อาจไม่มีก็ได้
                if (!error.message?.includes('Record to delete does not exist')) {
                    throw error;
                }
            }
        }
    }

    /**
     * ลบ CropCycle และข้อมูล Activities ที่เกี่ยวข้อง (Batch Delete)
     */
    private async processDeleteCropCycle(job: any) {
        const payload = job.payload as { cropCycleId: string };
        const { cropCycleId } = payload;

        if (!cropCycleId) throw new Error('cropCycleId is required');

        await this.jobService.logJob(job.id, 'INFO', `Starting deletion of CropCycle ${cropCycleId}`);

        // ลำดับการลบ (ลูกก่อน → แม่ทีหลัง)
        const deleteOrder = [
            { entity: 'ActivityImage', deleteFn: () => this.batchDeleteActivityImagesByCycle(cropCycleId, job.id) },
            { entity: 'Activity', deleteFn: () => this.batchDeleteByCropCycle('activity', cropCycleId, job.id) },
            { entity: 'CropCycle', deleteFn: () => this.prisma.cropCycle.delete({ where: { id: cropCycleId } }) },
        ];

        for (const step of deleteOrder) {
            await this.jobService.logJob(job.id, 'INFO', `Deleting ${step.entity}...`);

            try {
                await step.deleteFn();
                await this.jobService.logJob(job.id, 'INFO', `${step.entity} deleted`);
            } catch (error: any) {
                if (!error.message?.includes('Record to delete does not exist')) {
                    throw error;
                }
            }
        }
    }

    /**
     * Batch delete Activities by CropCycleId
     */
    private async batchDeleteByCropCycle(table: 'activity', cropCycleId: string, jobId: string) {
        let totalDeleted = 0;

        while (true) {
            const items = await this.prisma.activity.findMany({
                where: { cropCycleId },
                select: { id: true },
                take: BATCH_SIZE,
            });

            if (items.length === 0) break;

            const ids = items.map((item: { id: string }) => item.id);

            const result = await this.prisma.activity.deleteMany({
                where: { id: { in: ids } },
            });

            totalDeleted += result.count;
            await this.jobService.updateProgress(jobId, table, totalDeleted);
            await this.jobService.logJob(jobId, 'INFO', `Deleted ${totalDeleted} ${table} records`);
        }

        return totalDeleted;
    }

    /**
     * ลบ ActivityImage by CropCycleId
     */
    private async batchDeleteActivityImagesByCycle(cropCycleId: string, jobId: string) {
        let totalDeleted = 0;

        while (true) {
            const activities = await this.prisma.activity.findMany({
                where: { cropCycleId },
                select: { id: true },
                take: BATCH_SIZE,
            });

            if (activities.length === 0) break;

            const activityIds = activities.map(a => a.id);

            const result = await this.prisma.activityImage.deleteMany({
                where: { activityId: { in: activityIds } },
            });

            totalDeleted += result.count;
            await this.jobService.updateProgress(jobId, 'ActivityImage', totalDeleted);

            if (result.count === 0) break;
        }

        return totalDeleted;
    }

    /**
     * Batch delete สำหรับ table ที่มี data เยอะ
     */
    private async batchDelete(
        table: 'activity' | 'aiRecommendation' | 'cropCycle' | 'weatherSnapshot' | 'soilSnapshot' | 'farmMember',
        where: Record<string, any>,
        jobId: string,
    ) {
        let totalDeleted = 0;

        while (true) {
            // @ts-ignore - dynamic table access
            const items = await this.prisma[table].findMany({
                where,
                select: { id: true },
                take: BATCH_SIZE,
            });

            if (items.length === 0) break;

            const ids = items.map((item: { id: string }) => item.id);

            // @ts-ignore - dynamic table access
            const result = await this.prisma[table].deleteMany({
                where: { id: { in: ids } },
            });

            totalDeleted += result.count;

            await this.jobService.updateProgress(jobId, table, totalDeleted);
            await this.jobService.logJob(jobId, 'INFO', `Deleted ${totalDeleted} ${table} records`);
        }

        return totalDeleted;
    }

    /**
     * ลบ ActivityImage (ต้อง join กับ Activity)
     */
    private async batchDeleteActivityImages(plotId: string, jobId: string) {
        let totalDeleted = 0;

        while (true) {
            // หา activities ของ plot
            const activities = await this.prisma.activity.findMany({
                where: { plotId },
                select: { id: true },
                take: BATCH_SIZE,
            });

            if (activities.length === 0) break;

            const activityIds = activities.map(a => a.id);

            // ลบ images ของ activities เหล่านั้น
            const result = await this.prisma.activityImage.deleteMany({
                where: { activityId: { in: activityIds } },
            });

            totalDeleted += result.count;

            await this.jobService.updateProgress(jobId, 'ActivityImage', totalDeleted);

            // ถ้าไม่มี images ก็ออกจาก loop
            if (result.count === 0) break;
        }

        return totalDeleted;
    }

    /**
     * ลบ User และข้อมูลที่เกี่ยวข้อง
     */
    private async processDeleteUser(job: any) {
        const payload = job.payload as { userId: string };
        const { userId } = payload;

        if (!userId) throw new Error('userId is required');

        // User มี cascade delete อยู่แล้ว แต่เราอาจต้องลบของที่ไม่มี cascade
        await this.jobService.logJob(job.id, 'INFO', 'Deleting user data...');

        // ลบ activities ที่เยอะมาก เป็น batch ก่อน
        await this.batchDelete('activity', { userId }, job.id);

        // ลบ user (cascade จะลบอย่างอื่นให้)
        await this.prisma.user.delete({ where: { id: userId } });

        await this.jobService.logJob(job.id, 'INFO', 'User deleted successfully');
    }

    /**
     * ลบข้อมูลที่ archived นานเกิน X วัน
     */
    private async processCleanupArchive(job: any) {
        const payload = job.payload as { daysOld?: number };
        const daysOld = payload.daysOld || 90;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        await this.jobService.logJob(job.id, 'INFO', `Cleaning up data older than ${daysOld} days`);

        // ลบ plots ที่ archived เกิน X วัน
        const archivedPlots = await this.prisma.plot.findMany({
            where: {
                status: 'ARCHIVED',
                deletedAt: { lt: cutoffDate },
            },
            select: { id: true },
        });

        for (const plot of archivedPlots) {
            // สร้าง job ลบแต่ละ plot
            await this.jobService.createJob({
                type: 'DELETE_PLOT',
                payload: { plotId: plot.id },
            });
        }

        await this.jobService.logJob(job.id, 'INFO', `Queued ${archivedPlots.length} plot deletion jobs`);
    }
}
