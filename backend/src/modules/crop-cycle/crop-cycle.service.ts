import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JobService } from '../../jobs/job.service';
import { CropCycleStatus } from '@prisma/client';

export interface CreateCropCycleDto {
    plotId: string;
    cropType?: string;
    cropVarietyId?: string;
    startDate?: Date;
    note?: string;
    planId?: string;
}

export interface UpdateCropCycleDto {
    cropType?: string;
    cropVarietyId?: string;
    endDate?: Date;
    status?: CropCycleStatus;
    yield?: number;
    note?: string;
}

@Injectable()
export class CropCycleService {
    constructor(
        private prisma: PrismaService,
        private jobService: JobService,
    ) { }

    /**
     * สร้างรอบการปลูกใหม่
     */
    async create(userId: string, dto: CreateCropCycleDto) {
        // ตรวจสอบว่าแปลงเป็นของผู้ใช้หรือไม่
        const plot = await this.prisma.plot.findFirst({
            where: {
                id: dto.plotId,
                userId,
                deletedAt: null,
            },
        });

        if (!plot) {
            throw new NotFoundException('ไม่พบแปลงหรือคุณไม่มีสิทธิ์');
        }

        // ตรวจสอบว่ามีรอบการปลูกที่ยังไม่จบหรือไม่
        const activeCycle = await this.prisma.cropCycle.findFirst({
            where: {
                plotId: dto.plotId,
                status: 'ACTIVE',
                deletedAt: null,
            },
        });

        if (activeCycle) {
            throw new BadRequestException('แปลงนี้มีรอบการปลูกที่ยังไม่เสร็จสิ้น กรุณาจบรอบก่อนหน้าก่อน');
        }

        return this.prisma.cropCycle.create({
            data: {
                plotId: dto.plotId,
                cropType: dto.cropType,
                cropVarietyId: dto.cropVarietyId,
                startDate: dto.startDate || new Date(),
                note: dto.note,
                planId: dto.planId,
            },
            include: {
                plot: true,
                cropVariety: true,
            },
        });
    }

    /**
     * ดึงรายการรอบการปลูกตามแปลง
     */
    async findByPlot(plotId: string, userId: string) {
        // ตรวจสอบสิทธิ์
        const plot = await this.prisma.plot.findFirst({
            where: {
                id: plotId,
                OR: [
                    { userId },
                    { members: { some: { userId } } },
                ],
            },
        });

        if (!plot) {
            throw new NotFoundException('ไม่พบแปลงหรือคุณไม่มีสิทธิ์');
        }

        return this.prisma.cropCycle.findMany({
            where: {
                plotId,
                deletedAt: null,
            },
            include: {
                cropVariety: true,
                _count: {
                    select: { activities: true },
                },
            },
            orderBy: { startDate: 'desc' },
        });
    }

    /**
     * ดึงข้อมูลรอบการปลูกตาม ID
     */
    async findById(id: string, userId: string) {
        const cropCycle = await this.prisma.cropCycle.findFirst({
            where: {
                id,
                deletedAt: null,
                plot: {
                    OR: [
                        { userId },
                        { members: { some: { userId } } },
                    ],
                },
            },
            include: {
                plot: true,
                cropVariety: {
                    include: { cropType: true },
                },
                plan: {
                    include: { stages: { orderBy: { dayStart: 'asc' } } },
                },
                activities: {
                    where: { deletedAt: null },
                    orderBy: { date: 'desc' },
                    include: {
                        images: { select: { id: true, imageUrl: true } },
                    },
                },
                _count: {
                    select: { activities: { where: { deletedAt: null } } },
                },
            },
        });

        if (!cropCycle) {
            throw new NotFoundException('ไม่พบรอบการปลูก');
        }

        // Check for PLANTING activity
        const plantingActivity = await this.prisma.activity.findFirst({
            where: {
                cropCycleId: id,
                type: 'PLANTING',
                deletedAt: null,
            },
            select: { id: true, date: true, description: true },
        });

        // Calculate financial summary
        const byType = await this.prisma.activity.groupBy({
            by: ['type'],
            where: { cropCycleId: id, deletedAt: null },
            _sum: { amount: true },
            _count: true,
        });

        const totalExpense = Number(byType.find(t => t.type === 'EXPENSE')?._sum.amount || 0);
        const totalIncome = Number(byType.find(t => t.type === 'INCOME')?._sum.amount || 0);

        return {
            ...cropCycle,
            hasPlanting: !!plantingActivity,
            plantingActivity: plantingActivity || null,
            financeSummary: {
                totalExpense,
                totalIncome,
                profit: totalIncome - totalExpense,
                activityCount: byType.reduce((a, b) => a + b._count, 0),
            },
        };
    }

    /**
     * อัปเดตรอบการปลูก
     */
    async update(id: string, userId: string, dto: UpdateCropCycleDto) {
        const cropCycle = await this.prisma.cropCycle.findFirst({
            where: {
                id,
                plot: { userId },
            },
        });

        if (!cropCycle) {
            throw new NotFoundException('ไม่พบรอบการปลูกหรือคุณไม่มีสิทธิ์');
        }

        let planId = undefined;

        // Auto-assign plan if variety updates
        if (dto.cropVarietyId) {
            const defaultPlan = await this.prisma.cropPlan.findFirst({
                where: {
                    varieties: { some: { id: dto.cropVarietyId } }
                },
                orderBy: { createdAt: 'desc' },
                take: 1
            });

            if (defaultPlan) {
                planId = defaultPlan.id;
            }
        }

        return this.prisma.cropCycle.update({
            where: { id },
            data: {
                cropType: dto.cropType,
                cropVarietyId: dto.cropVarietyId,
                endDate: dto.endDate,
                status: dto.status,
                yield: dto.yield,
                note: dto.note,
                ...(planId && { planId }), // Update planId if found
            },
            include: {
                plot: true,
                cropVariety: true,
                plan: true,
            },
        });
    }

    /**
     * จบรอบการปลูก
     */
    async complete(id: string, userId: string, yieldAmount?: number) {
        const cropCycle = await this.prisma.cropCycle.findFirst({
            where: {
                id,
                plot: { userId },
            },
        });

        if (!cropCycle) {
            throw new NotFoundException('ไม่พบรอบการปลูกหรือคุณไม่มีสิทธิ์');
        }

        return this.prisma.cropCycle.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                endDate: new Date(),
                yield: yieldAmount,
            },
        });
    }

    /**
     * ลบรอบการปลูก (Soft Delete + Background Job)
     */
    async softDelete(id: string, userId: string) {
        const cropCycle = await this.prisma.cropCycle.findFirst({
            where: {
                id,
                plot: { userId },
            },
        });

        if (!cropCycle) {
            throw new NotFoundException('ไม่พบรอบการปลูกหรือคุณไม่มีสิทธิ์');
        }

        // Soft delete: mark as deleted
        await this.prisma.cropCycle.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        // Enqueue background job to delete activities
        await this.jobService.createJob({
            type: 'DELETE_CROP_CYCLE',
            payload: { cropCycleId: id },
        });

        return { success: true, message: 'รอบการปลูกถูกทำเครื่องหมายเพื่อลบ กำลังลบข้อมูลที่เกี่ยวข้อง...' };
    }
}
