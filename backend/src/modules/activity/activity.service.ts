import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActivityType } from '@prisma/client';

// Re-export specific DTOs from shared
import { CreateActivityDto, UpdateActivityDto, ActivityFilterDto } from '@shared/types/activity';
export { CreateActivityDto, UpdateActivityDto, ActivityFilterDto };

@Injectable()
export class ActivityService {
    constructor(private prisma: PrismaService) { }

    /**
     * สร้างกิจกรรมใหม่
     */
    async create(userId: string, dto: CreateActivityDto) {
        // [VALIDATION] Category: ต้องมีอย่างน้อย 1 อย่าง (Category ID หรือ ชื่อเอง) - ยกเว้นการปลูก (ใช้ระบบจัดการเอง)
        if (dto.type !== 'PLANTING' && !dto.categoryId && !dto.customCategoryName) {
            throw new BadRequestException('กรุณาระบุหมวดหมู่กิจกรรม (เลือกจากรายการ หรือ ระบุเอง)');
        }

        // [LOGIC] Auto-link active cycle if not provided
        if (!dto.cropCycleId && dto.plotId) {
            let activeCycle = await this.prisma.cropCycle.findFirst({
                where: { plotId: dto.plotId, status: 'ACTIVE' },
                orderBy: { createdAt: 'desc' },
                include: { cropVariety: true } // Need variety info
            });

            // If Planting with Variety, try to match or use empty
            if (dto.type === 'PLANTING' && dto.cropVarietyId) {
                if (activeCycle) {
                    // 1. If Active Cycle has NO variety -> Use and Update later
                    if (!activeCycle.cropVarietyId) {
                        dto.cropCycleId = activeCycle.id;
                    }
                    // 2. If Active Cycle HAS variety -> Check match
                    else if (activeCycle.cropVarietyId === dto.cropVarietyId) {
                        dto.cropCycleId = activeCycle.id;
                    }
                    // 3. Mismatch -> Do not use this cycle (Create new logic below?)
                    // For now, if mismatch, we probably shouldn't auto-link. 
                    // But wait, user "Planting" might mean "Start New Cycle".
                    else {
                        // Active cycle exists but different variety.
                        // Should we close previous and start new? Or just allow parallel?
                        // System usually 1 active cycle per plot?
                        // Let's assume for simpler UX: If mismatch, we don't link, which creates logic validation error later if cycle required?
                        // Actually, if we don't link, we should CREATE a new cycle if Planting?
                    }
                } else {
                    // No active cycle, Create NEW one?
                    // Or just leave null and let validation fail if strict?
                    // Logic: If Planting and no active cycle, create one!
                    const newCycle = await this.prisma.cropCycle.create({
                        data: {
                            plotId: dto.plotId,
                            cropVarietyId: dto.cropVarietyId,
                            status: 'ACTIVE',
                            startDate: dto.date || new Date(),
                            plantedAt: dto.date || new Date()
                        }
                    });
                    dto.cropCycleId = newCycle.id;
                }
            } else {
                // Not planting or No variety specified -> Just use active
                if (activeCycle) dto.cropCycleId = activeCycle.id;
            }
        }

        // [LOGIC] Handle PLANTING 
        if (dto.type === 'PLANTING') {
            // Check Duplicate Planting
            if (dto.cropCycleId) {
                const existingPlanting = await this.prisma.activity.count({
                    where: {
                        cropCycleId: dto.cropCycleId,
                        type: 'PLANTING',
                        deletedAt: null,
                    },
                });

                if (existingPlanting > 0) {
                    throw new BadRequestException('รอบการปลูกนี้มีการบันทึกการปลูกไปแล้ว');
                }
            }
        }

        const activity = await this.prisma.activity.create({
            data: {
                type: dto.type,
                amount: dto.amount,
                description: dto.description,
                date: dto.date || new Date(),
                userId,
                plotId: dto.plotId,
                cropCycleId: dto.cropCycleId,
                categoryId: dto.categoryId,
                customCategoryName: dto.customCategoryName,
                productId: dto.productId,
                customProductName: dto.customProductName,
                quantity: dto.quantity,
                unit: dto.unit,
                unitPrice: dto.unitPrice,
            },
            include: {
                plot: true,
                cropCycle: true,
                category: true,
                product: true,
            },
        });

        // [LOGIC] Create Activity Images
        if (dto.images && dto.images.length > 0) {
            await this.prisma.activityImage.createMany({
                data: dto.images.map(url => ({
                    activityId: activity.id,
                    imageUrl: url
                }))
            });
        }

        // [LOGIC] Update plantedAt in CropCycle
        if (dto.type === 'PLANTING' && dto.cropCycleId) {
            const dataToUpdate: any = { plantedAt: dto.date || new Date() };

            // Check if we need to update variety
            if (dto.cropVarietyId) {
                const currentCycle = await this.prisma.cropCycle.findUnique({ where: { id: dto.cropCycleId } });
                if (currentCycle && !currentCycle.cropVarietyId) {
                    dataToUpdate.cropVarietyId = dto.cropVarietyId;
                }
            }

            await this.prisma.cropCycle.update({
                where: { id: dto.cropCycleId },
                data: dataToUpdate,
            });
        }

        return activity;
    }

    /**
     * ดึงรายการกิจกรรมของผู้ใช้
     */
    async findAll(userId: string, filter: ActivityFilterDto) {
        const page = filter.page || 1;
        const limit = filter.limit || 20;
        const skip = (page - 1) * limit;

        const where: any = {
            userId,
            deletedAt: null,
        };

        if (filter.type) where.type = filter.type;
        if (filter.plotId) where.plotId = filter.plotId;
        if (filter.cropCycleId) where.cropCycleId = filter.cropCycleId;
        if (filter.startDate || filter.endDate) {
            where.date = {};
            if (filter.startDate) where.date.gte = filter.startDate;
            if (filter.endDate) where.date.lte = filter.endDate;
        }

        const [activities, total] = await Promise.all([
            this.prisma.activity.findMany({
                where,
                include: {
                    plot: { select: { id: true, name: true } },
                    cropCycle: { select: { id: true, cropType: true, cropVariety: { select: { name: true } } } },
                    category: true,
                    product: { select: { id: true, name: true } },
                    images: true,
                },
                orderBy: { date: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.activity.count({ where }),
        ]);

        return {
            data: activities,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * ดึงรายการหมวดหมู่กิจกรรม
     */
    async findAllCategories() {
        return this.prisma.activityCategory.findMany({
            orderBy: { name: 'asc' },
        });
    }
    /**
     * ดึงกิจกรรมตาม ID
     */
    async findById(id: string, userId: string) {
        const activity = await this.prisma.activity.findFirst({
            where: {
                id,
                userId,
                deletedAt: null,
            },
            include: {
                plot: true,
                cropCycle: { include: { cropVariety: true } },
                category: true,
                product: true,
                images: true,
            },
        });

        if (!activity) {
            throw new NotFoundException('ไม่พบกิจกรรม');
        }

        return activity;
    }

    /**
     * อัปเดตกิจกรรม
     */
    async update(id: string, userId: string, dto: UpdateActivityDto) {
        const activity = await this.prisma.activity.findFirst({
            where: { id, userId },
        });

        if (!activity) {
            throw new NotFoundException('ไม่พบกิจกรรมหรือคุณไม่มีสิทธิ์');
        }

        const { images, cropVarietyId, ...updateData } = dto;

        const result = await this.prisma.activity.update({
            where: { id },
            data: updateData,
            include: {
                plot: true,
                cropCycle: true,
                category: true,
                product: true,
            },
        });

        // If Planting activity, update CropCycle plantedAt
        if (result.type === 'PLANTING' && result.cropCycleId) {
            const cycleUpdateData: any = { plantedAt: result.date };

            // [NEW] Update cropVariety if provided in update
            if (cropVarietyId) {
                cycleUpdateData.cropVarietyId = cropVarietyId;
            }

            await this.prisma.cropCycle.update({
                where: { id: result.cropCycleId },
                data: cycleUpdateData,
            });
        }

        return result;
    }

    /**
     * ลบกิจกรรม (Soft Delete)
     */
    async softDelete(id: string, userId: string) {
        const activity = await this.prisma.activity.findFirst({
            where: { id, userId },
        });

        if (!activity) {
            throw new NotFoundException('ไม่พบกิจกรรมหรือคุณไม่มีสิทธิ์');
        }

        return this.prisma.activity.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    /**
     * สรุปกิจกรรมของผู้ใช้
     */
    async getSummary(userId: string, startDate?: Date, endDate?: Date) {
        const where: any = {
            userId,
            deletedAt: null,
        };

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = startDate;
            if (endDate) where.date.lte = endDate;
        }

        const [income, expense, plantingCount] = await Promise.all([
            this.prisma.activity.aggregate({
                where: { ...where, type: 'INCOME' },
                _sum: { amount: true },
                _count: true,
            }),
            this.prisma.activity.aggregate({
                where: { ...where, type: 'EXPENSE' },
                _sum: { amount: true },
                _count: true,
            }),
            this.prisma.activity.count({
                where: { ...where, type: 'PLANTING' },
            }),
        ]);

        return {
            income: {
                total: income._sum.amount || 0,
                count: income._count,
            },
            expense: {
                total: expense._sum.amount || 0,
                count: expense._count,
            },
            planting: {
                count: plantingCount,
            },
            profit: (Number(income._sum.amount) || 0) - (Number(expense._sum.amount) || 0),
        };
    }

    /**
     * สรุปกิจกรรมแยกตามแปลง
     */
    async getPlotSummary(userId: string, startDate?: Date, endDate?: Date) {
        const where: any = {
            userId,
            deletedAt: null,
            plotId: { not: null }
        };

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = startDate;
            if (endDate) where.date.lte = endDate;
        }

        // 1. Group by Plot and Type
        const grouped = await this.prisma.activity.groupBy({
            by: ['plotId', 'type'],
            where,
            _sum: { amount: true },
            _count: true,
        });

        // 2. Get Plot Details
        const plots = await this.prisma.plot.findMany({
            where: { userId },
            select: { id: true, name: true, image: true, status: true }
        });

        // 3. Map Data
        const summary = plots.map(plot => {
            const plotActivities = grouped.filter(g => g.plotId === plot.id);
            const income = plotActivities.find(a => a.type === 'INCOME')?._sum.amount || 0;
            const expense = plotActivities.find(a => a.type === 'EXPENSE')?._sum.amount || 0;
            const planting = plotActivities.find(a => a.type === 'PLANTING')?._count || 0;

            return {
                plotId: plot.id,
                plotName: plot.name,
                plotImage: plot.image,
                income: Number(income),
                expense: Number(expense),
                profit: Number(income) - Number(expense),
                plantingCount: planting
            };
        });

        // Sort by Profit Descending
        return summary.sort((a, b) => b.profit - a.profit);
    }
}
