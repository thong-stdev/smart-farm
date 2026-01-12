import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PlotStatus } from '@prisma/client';
import { JobService } from '../../jobs/job.service';

export interface CreatePlotDto {
    name: string;
    size: number;
    lat?: number;
    lng?: number;
    image?: string;
    address?: string;
}

export interface UpdatePlotDto {
    name?: string;
    size?: number;
    status?: PlotStatus;
    lat?: number;
    lng?: number;
    image?: string;
    address?: string;
}

@Injectable()
export class PlotService {
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => JobService))
        private jobService: JobService,
    ) { }

    /**
     * สร้างแปลงใหม่
     */
    async create(userId: string, dto: CreatePlotDto) {
        return this.prisma.plot.create({
            data: {
                name: dto.name,
                size: dto.size,
                lat: dto.lat,
                lng: dto.lng,
                image: dto.image,
                address: dto.address,
                userId,
            },
        });
    }

    /**
     * ดึงรายการแปลงของผู้ใช้
     */
    async findAllByUser(userId: string) {
        return this.prisma.plot.findMany({
            where: {
                userId,
                deletedAt: null,
                status: { not: 'ARCHIVED' },
            },
            include: {
                _count: {
                    select: {
                        cropCycles: true,
                        activities: true,
                    },
                },
                cropCycles: {
                    where: { status: 'ACTIVE' },
                    include: { cropVariety: true },
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * ดึงข้อมูลแปลงตาม ID
     */
    async findById(id: string, userId: string) {
        const plot = await this.prisma.plot.findFirst({
            where: {
                id,
                deletedAt: null,
                OR: [
                    { userId },
                    { members: { some: { userId } } },
                ],
            },
            include: {
                cropCycles: {
                    include: { cropVariety: true },
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
                activities: {
                    orderBy: { date: 'desc' },
                    take: 10,
                },
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                displayName: true,
                                pictureUrl: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        cropCycles: true,
                        activities: true,
                    },
                },
            },
        });

        if (!plot) {
            throw new NotFoundException('ไม่พบแปลง');
        }

        return plot;
    }

    /**
     * อัปเดตข้อมูลแปลง
     */
    async update(id: string, userId: string, dto: UpdatePlotDto) {
        const plot = await this.prisma.plot.findFirst({
            where: { id, userId },
        });

        if (!plot) {
            throw new NotFoundException('ไม่พบแปลงหรือคุณไม่มีสิทธิ์แก้ไข');
        }

        return this.prisma.plot.update({
            where: { id },
            data: dto,
        });
    }

    /**
     * ลบแปลง (Soft Delete + Background Job)
     * 1. เปลี่ยน status เป็น ARCHIVED
     * 2. สร้าง background job สำหรับลบข้อมูลจริง
     */
    async softDelete(id: string, userId: string) {
        const plot = await this.prisma.plot.findFirst({
            where: { id, userId },
        });

        if (!plot) {
            throw new NotFoundException('ไม่พบแปลงหรือคุณไม่มีสิทธิ์ลบ');
        }

        // 1. Soft delete - เปลี่ยน status เป็น ARCHIVED
        await this.prisma.plot.update({
            where: { id },
            data: {
                status: 'ARCHIVED',
                deletedAt: new Date(),
            },
        });

        // 2. สร้าง background job สำหรับลบข้อมูลจริงทีหลัง
        const job = await this.jobService.createJob({
            type: 'DELETE_PLOT',
            payload: { plotId: id, plotName: plot.name },
            triggeredByUserId: userId,
        });

        return {
            message: 'แปลงถูกลบแล้ว ข้อมูลจะถูกล้างในเบื้องหลัง',
            jobId: job.id,
        };
    }


    /**
     * สรุปสถิติแปลง
     */
    async getPlotStats(id: string, userId: string) {
        const plot = await this.findById(id, userId);

        // คำนวณสถิติรายรับ-รายจ่าย
        const incomeStats = await this.prisma.activity.aggregate({
            where: {
                plotId: id,
                type: 'INCOME',
                deletedAt: null,
            },
            _sum: { amount: true },
            _count: true,
        });

        const expenseStats = await this.prisma.activity.aggregate({
            where: {
                plotId: id,
                type: 'EXPENSE',
                deletedAt: null,
            },
            _sum: { amount: true },
            _count: true,
        });

        return {
            plot,
            stats: {
                totalIncome: incomeStats._sum.amount || 0,
                incomeCount: incomeStats._count,
                totalExpense: expenseStats._sum.amount || 0,
                expenseCount: expenseStats._count,
                profit: (Number(incomeStats._sum.amount) || 0) - (Number(expenseStats._sum.amount) || 0),
            },
        };
    }
}
