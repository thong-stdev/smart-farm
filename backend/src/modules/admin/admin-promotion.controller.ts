import { Controller, Get, Post, Param, Query, Delete, Patch, Body, Ip, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminBaseService } from './admin-base.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * AdminPromotionController - จัดการ Product Promotions/Sponsors
 */
@ApiTags('Admin - Promotions')
@Controller('admin')
@ApiBearerAuth()
export class AdminPromotionController {
    constructor(private readonly base: AdminBaseService) { }

    @Get('promotions')
    @ApiOperation({ summary: 'รายการ ProductPromotion ทั้งหมด' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'isActive', required: false })
    async getProductPromotions(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
        @Query('isActive') isActive?: string,
    ) {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        const [items, total] = await Promise.all([
            this.base.prisma.productPromotion.findMany({
                where,
                include: {
                    product: {
                        select: { id: true, name: true, imageUrl: true, brand: { select: { name: true } } },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum,
            }),
            this.base.prisma.productPromotion.count({ where }),
        ]);

        return {
            items,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        };
    }

    @Post('promotions')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'สร้าง ProductPromotion ใหม่' })
    async createProductPromotion(
        @Body() body: {
            productId: string;
            sponsorName?: string;
            campaignName?: string;
            bidAmount: number;
            priority?: number;
            startAt: string;
            endAt: string;
            targetCropTypeId?: string;
            targetPlotId?: string;
            targetRegion?: string;
            aiBoostFactor?: number;
        },
        @Request() req: any,
        @Ip() ip: string,
    ) {
        const promotion = await this.base.prisma.productPromotion.create({
            data: {
                productId: body.productId,
                sponsorName: body.sponsorName,
                campaignName: body.campaignName,
                bidAmount: body.bidAmount,
                priority: body.priority,
                startAt: new Date(body.startAt),
                endAt: new Date(body.endAt),
                targetCropTypeId: body.targetCropTypeId,
                targetPlotId: body.targetPlotId,
                targetRegion: body.targetRegion,
                aiBoostFactor: body.aiBoostFactor || 1.0,
            },
            include: {
                product: { select: { id: true, name: true } },
            },
        });

        // อัปเดต isSponsored ใน Product
        await this.base.prisma.product.update({
            where: { id: body.productId },
            data: { isSponsored: true },
        });

        await this.base.logAction('CREATE', 'ProductPromotion', promotion.id, { productId: body.productId, sponsorName: body.sponsorName }, ip, req.user?.sub);

        return promotion;
    }

    @Patch('promotions/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'อัปเดต ProductPromotion' })
    async updateProductPromotion(
        @Param('id') id: string,
        @Body() body: {
            sponsorName?: string;
            campaignName?: string;
            bidAmount?: number;
            priority?: number;
            startAt?: string;
            endAt?: string;
            aiBoostFactor?: number;
            isActive?: boolean;
        },
        @Request() req: any,
        @Ip() ip: string,
    ) {
        const updateData: any = { ...body };
        if (body.startAt) updateData.startAt = new Date(body.startAt);
        if (body.endAt) updateData.endAt = new Date(body.endAt);

        const promotion = await this.base.prisma.productPromotion.update({
            where: { id },
            data: updateData,
            include: {
                product: { select: { id: true, name: true } },
            },
        });

        await this.base.logAction('UPDATE', 'ProductPromotion', id, body, ip, req.user?.sub);

        return promotion;
    }

    @Delete('promotions/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'ลบ ProductPromotion' })
    async deleteProductPromotion(
        @Param('id') id: string,
        @Request() req: any,
        @Ip() ip: string,
    ) {
        const promotion = await this.base.prisma.productPromotion.delete({
            where: { id },
        });

        // ตรวจสอบว่ายังมี promotion อื่นของ product นี้หรือไม่
        const remainingPromotions = await this.base.prisma.productPromotion.count({
            where: { productId: promotion.productId, isActive: true },
        });

        if (remainingPromotions === 0) {
            await this.base.prisma.product.update({
                where: { id: promotion.productId },
                data: { isSponsored: false },
            });
        }

        await this.base.logAction('DELETE', 'ProductPromotion', id, null, ip, req.user?.sub);

        return { message: 'ลบสำเร็จ' };
    }

    // ==================== PRODUCT RANKINGS ====================

    @Post('products/recalculate-ranks')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'คำนวณ ranking ใหม่สำหรับทุกสินค้า' })
    async recalculateProductRanks(
        @Request() req: any,
        @Ip() ip: string,
    ) {
        // ดึงสินค้าทั้งหมด
        const products = await this.base.prisma.product.findMany({
            where: { isActive: true },
            include: {
                promotions: {
                    where: {
                        isActive: true,
                        startAt: { lte: new Date() },
                        endAt: { gte: new Date() },
                    },
                },
            },
        });

        // คำนวณ ranking สำหรับแต่ละสินค้า
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        for (const product of products) {
            // นับ impressions และ clicks
            const [impressions, clicks] = await Promise.all([
                this.base.prisma.productImpression.count({
                    where: { productId: product.id, createdAt: { gte: thirtyDaysAgo } },
                }),
                this.base.prisma.productClick.count({
                    where: { productId: product.id, createdAt: { gte: thirtyDaysAgo } },
                }),
            ]);

            // คำนวณ CTR
            const ctr = impressions > 0 ? clicks / impressions : 0;

            // คำนวณ score
            let score = ctr * 100; // base score from CTR

            // เพิ่ม boost จาก promotions
            for (const promo of product.promotions) {
                score *= promo.aiBoostFactor;
                score += parseFloat(promo.bidAmount.toString()) * 0.01;
                if (promo.priority) {
                    score += promo.priority * 10;
                }
            }

            // Upsert rank cache
            await this.base.prisma.productRankCache.upsert({
                where: { productId: product.id },
                create: {
                    productId: product.id,
                    score,
                    impressions,
                    clicks,
                    ctr,
                },
                update: {
                    score,
                    impressions,
                    clicks,
                    ctr,
                },
            });
        }

        await this.base.logAction('RECALCULATE', 'ProductRankCache', undefined, { count: products.length }, ip, req.user?.sub);

        return { message: `คำนวณ ranking ใหม่สำหรับ ${products.length} สินค้าเรียบร้อย` };
    }

    @Get('products/rankings')
    @ApiOperation({ summary: 'รายการสินค้าเรียงตาม ranking' })
    @ApiQuery({ name: 'limit', required: false })
    async getProductRankings(
        @Query('limit') limit: string = '20',
    ) {
        const limitNum = parseInt(limit, 10);

        return this.base.prisma.productRankCache.findMany({
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        isSponsored: true,
                        brand: { select: { name: true } },
                    },
                },
            },
            orderBy: { score: 'desc' },
            take: limitNum,
        });
    }
}
