import { Controller, Get, Post, Param, Query, Delete, Patch, Body, Ip, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminBaseService } from './admin-base.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * AdminProductController - จัดการสินค้า, หมวดหมู่, แบรนด์, ประเภทพืช
 */
@ApiTags('Admin - Products')
@Controller('admin')
@ApiBearerAuth()
export class AdminProductController {
    constructor(private readonly base: AdminBaseService) { }

    // ==================== PRODUCT CATEGORIES ====================

    @Get('product-categories')
    @ApiOperation({ summary: 'ดึงหมวดหมู่สินค้าทั้งหมด' })
    async getProductCategories() {
        const categories = await this.base.prisma.productCategory.findMany({
            include: {
                _count: { select: { products: true, types: true } },
            },
            orderBy: { name: 'asc' },
        });

        return categories.map(c => ({
            id: c.id,
            name: c.name,
            productCount: c._count.products,
            typeCount: c._count.types,
            createdAt: c.createdAt,
        }));
    }

    @Post('product-categories')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'สร้างหมวดหมู่สินค้าใหม่' })
    async createProductCategory(@Body() body: { name: string }, @Request() req: any, @Ip() ip: string) {
        const result = await this.base.prisma.productCategory.create({ data: { name: body.name } });
        await this.base.logAction('CREATE', 'ProductCategory', result.id, body, ip, req?.user?.sub);
        return result;
    }

    @Patch('product-categories/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'แก้ไขหมวดหมู่สินค้า' })
    async updateProductCategory(@Param('id') id: string, @Body() body: { name: string }, @Request() req: any, @Ip() ip: string) {
        const result = await this.base.prisma.productCategory.update({ where: { id }, data: { name: body.name } });
        await this.base.logAction('UPDATE', 'ProductCategory', id, body, ip, req?.user?.sub);
        return result;
    }

    @Delete('product-categories/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'ลบหมวดหมู่สินค้า' })
    async deleteProductCategory(@Param('id') id: string, @Request() req: any, @Ip() ip: string) {
        const result = await this.base.prisma.productCategory.delete({ where: { id } });
        await this.base.logAction('DELETE', 'ProductCategory', id, null, ip, req?.user?.sub);
        return result;
    }

    // ==================== PRODUCT BRANDS ====================

    @Get('product-brands')
    @ApiOperation({ summary: 'ดึงแบรนด์สินค้าทั้งหมด' })
    async getProductBrands() {
        const brands = await this.base.prisma.productBrand.findMany({
            include: {
                _count: { select: { products: true } },
            },
            orderBy: { name: 'asc' },
        });

        return brands.map(b => ({
            id: b.id,
            name: b.name,
            productCount: b._count.products,
            createdAt: b.createdAt,
        }));
    }

    @Post('product-brands')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'สร้างแบรนด์สินค้าใหม่' })
    async createProductBrand(@Body() body: { name: string }, @Request() req: any, @Ip() ip: string) {
        const result = await this.base.prisma.productBrand.create({ data: { name: body.name } });
        await this.base.logAction('CREATE', 'ProductBrand', result.id, body, ip, req?.user?.sub);
        return result;
    }

    @Patch('product-brands/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'แก้ไขแบรนด์สินค้า' })
    async updateProductBrand(@Param('id') id: string, @Body() body: { name: string }, @Request() req: any, @Ip() ip: string) {
        const result = await this.base.prisma.productBrand.update({ where: { id }, data: { name: body.name } });
        await this.base.logAction('UPDATE', 'ProductBrand', id, body, ip, req?.user?.sub);
        return result;
    }

    @Delete('product-brands/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'ลบแบรนด์สินค้า' })
    async deleteProductBrand(@Param('id') id: string, @Request() req: any, @Ip() ip: string) {
        const result = await this.base.prisma.productBrand.delete({ where: { id } });
        await this.base.logAction('DELETE', 'ProductBrand', id, undefined, ip, req?.user?.sub);
        return result;
    }

    // ==================== PRODUCT TYPES ====================

    @Get('product-types')
    @ApiOperation({ summary: 'ดึงประเภทย่อยสินค้าทั้งหมด' })
    async getProductTypes() {
        const types = await this.base.prisma.productType.findMany({
            include: {
                category: { select: { id: true, name: true } },
                _count: { select: { products: true } },
            },
            orderBy: { name: 'asc' },
        });

        return types.map(t => ({
            id: t.id,
            name: t.name,
            category: t.category,
            productCount: t._count.products,
            createdAt: t.createdAt,
        }));
    }

    @Post('product-types')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'สร้างประเภทย่อยสินค้าใหม่' })
    async createProductType(@Body() body: { name: string; categoryId: string }, @Request() req: any, @Ip() ip: string) {
        const result = await this.base.prisma.productType.create({ data: { name: body.name, categoryId: body.categoryId } });
        await this.base.logAction('CREATE', 'ProductType', result.id, body, ip, req?.user?.sub);
        return result;
    }

    @Patch('product-types/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'แก้ไขประเภทย่อยสินค้า' })
    async updateProductType(@Param('id') id: string, @Body() body: { name?: string; categoryId?: string }, @Request() req: any, @Ip() ip: string) {
        const result = await this.base.prisma.productType.update({ where: { id }, data: body });
        await this.base.logAction('UPDATE', 'ProductType', id, body, ip, req?.user?.sub);
        return result;
    }

    @Delete('product-types/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'ลบประเภทย่อยสินค้า' })
    async deleteProductType(@Param('id') id: string, @Request() req: any, @Ip() ip: string) {
        const result = await this.base.prisma.productType.delete({ where: { id } });
        await this.base.logAction('DELETE', 'ProductType', id, undefined, ip, req?.user?.sub);
        return result;
    }

    // ==================== CROP TYPES ====================

    @Get('crop-types')
    @ApiOperation({ summary: 'ดึงประเภทพืชทั้งหมด' })
    async getCropTypes() {
        const cropTypes = await this.base.prisma.cropType.findMany({
            include: {
                _count: { select: { varieties: true } },
                varieties: {
                    select: { id: true, name: true, duration: true },
                },
            },
            orderBy: { name: 'asc' },
        });

        return cropTypes.map(ct => ({
            id: ct.id,
            name: ct.name,
            varietyCount: ct._count.varieties,
            varieties: ct.varieties,
            createdAt: ct.createdAt,
        }));
    }

    @Post('crop-types')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'สร้างประเภทพืชใหม่' })
    async createCropType(@Body() body: { name: string }, @Request() req: any, @Ip() ip: string) {
        const result = await this.base.prisma.cropType.create({ data: { name: body.name } });
        await this.base.logAction('CREATE', 'CropType', result.id, body, ip, req?.user?.sub);
        return result;
    }

    @Patch('crop-types/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'แก้ไขประเภทพืช' })
    async updateCropType(@Param('id') id: string, @Body() body: { name: string }, @Request() req: any, @Ip() ip: string) {
        const result = await this.base.prisma.cropType.update({ where: { id }, data: { name: body.name } });
        await this.base.logAction('UPDATE', 'CropType', id, body, ip, req?.user?.sub);
        return result;
    }

    @Delete('crop-types/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'ลบประเภทพืช' })
    async deleteCropType(@Param('id') id: string, @Request() req: any, @Ip() ip: string) {
        const result = await this.base.prisma.cropType.delete({ where: { id } });
        await this.base.logAction('DELETE', 'CropType', id, undefined, ip, req?.user?.sub);
        return result;
    }

    // ==================== CROP VARIETIES ====================

    @Post('crop-varieties')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'สร้างพันธุ์พืชใหม่' })
    async createCropVariety(@Body() body: { name: string; duration?: number; cropTypeId: string }, @Request() req: any, @Ip() ip: string) {
        const result = await this.base.prisma.cropVariety.create({
            data: { name: body.name, duration: body.duration, cropTypeId: body.cropTypeId },
        });
        await this.base.logAction('CREATE', 'CropVariety', result.id, body, ip, req?.user?.sub);
        return result;
    }

    @Patch('crop-varieties/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'แก้ไขพันธุ์พืช' })
    async updateCropVariety(@Param('id') id: string, @Body() body: { name?: string; duration?: number }, @Request() req: any, @Ip() ip: string) {
        const result = await this.base.prisma.cropVariety.update({ where: { id }, data: body });
        await this.base.logAction('UPDATE', 'CropVariety', id, body, ip, req?.user?.sub);
        return result;
    }

    @Delete('crop-varieties/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'ลบพันธุ์พืช' })
    async deleteCropVariety(@Param('id') id: string, @Request() req: any, @Ip() ip: string) {
        const result = await this.base.prisma.cropVariety.delete({ where: { id } });
        await this.base.logAction('DELETE', 'CropVariety', id, undefined, ip, req?.user?.sub);
        return result;
    }

    // ==================== PRODUCTS ====================

    @Get('products')
    @ApiOperation({ summary: 'ดึงสินค้าทั้งหมด' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    async getProducts(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
        @Query('search') search?: string,
    ) {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        const [products, total] = await Promise.all([
            this.base.prisma.product.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    category: { select: { id: true, name: true } },
                    type: { select: { id: true, name: true } },
                    brand: { select: { id: true, name: true } },
                },
            }),
            this.base.prisma.product.count({ where }),
        ]);

        return {
            items: products,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        };
    }

    @Post('products')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'สร้างสินค้าใหม่' })
    async createProduct(
        @Body() body: {
            name: string;
            categoryId?: string;
            typeId?: string;
            brandId?: string;
            price?: number;
            description?: string;
            imageUrl?: string;
            unit?: string;
        },
        @Request() req: any,
        @Ip() ip: string,
    ) {
        const result = await this.base.prisma.product.create({ data: body as any });
        await this.base.logAction('CREATE', 'Product', result.id, body, ip, req?.user?.sub);
        return result;
    }

    @Patch('products/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'แก้ไขสินค้า' })
    async updateProduct(
        @Param('id') id: string,
        @Body() body: {
            name?: string;
            categoryId?: string;
            typeId?: string;
            brandId?: string;
            price?: number;
            description?: string;
            imageUrl?: string;
            unit?: string;
            isActive?: boolean;
        },
        @Request() req: any,
        @Ip() ip: string,
    ) {
        const result = await this.base.prisma.product.update({ where: { id }, data: body as any });
        await this.base.logAction('UPDATE', 'Product', id, body, ip, req?.user?.sub);
        return result;
    }

    @Delete('products/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'ลบสินค้า' })
    async deleteProduct(@Param('id') id: string, @Request() req: any, @Ip() ip: string) {
        const result = await this.base.prisma.product.delete({ where: { id } });
        await this.base.logAction('DELETE', 'Product', id, undefined, ip, req?.user?.sub);
        return result;
    }

    // ==================== CROP PLANS ====================

    @Get('crop-plans')
    @ApiOperation({ summary: 'ดึงแผนการปลูกทั้งหมด' })
    async getCropPlans() {
        const plans = await this.base.prisma.cropPlan.findMany({
            include: {
                varieties: {
                    include: {
                        cropType: { select: { id: true, name: true } },
                    },
                },
                _count: { select: { stages: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return plans.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            varieties: p.varieties,
            stageCount: p._count.stages,
            createdAt: p.createdAt,
        }));
    }

    // ==================== ACTIVITY CATEGORIES ====================

    @Get('activity-categories')
    @ApiOperation({ summary: 'ดึงหมวดหมู่กิจกรรมทั้งหมด' })
    async getActivityCategories() {
        return this.base.prisma.activityCategory.findMany({
            orderBy: { name: 'asc' },
        });
    }

    @Post('activity-categories')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'สร้างหมวดหมู่กิจกรรมใหม่' })
    async createActivityCategory(
        @Body() body: { name: string; type: 'INCOME' | 'EXPENSE' | 'PLANTING' | 'GENERAL' },
        @Request() req: any,
        @Ip() ip: string,
    ) {
        const result = await this.base.prisma.activityCategory.create({
            data: { name: body.name, type: body.type },
        });
        await this.base.logAction('CREATE', 'ActivityCategory', result.id, body, ip, req?.user?.sub);
        return result;
    }

    @Patch('activity-categories/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'แก้ไขหมวดหมู่กิจกรรม' })
    async updateActivityCategory(
        @Param('id') id: string,
        @Body() body: { name?: string; type?: 'INCOME' | 'EXPENSE' | 'PLANTING' | 'GENERAL' },
        @Request() req: any,
        @Ip() ip: string,
    ) {
        const result = await this.base.prisma.activityCategory.update({ where: { id }, data: body });
        await this.base.logAction('UPDATE', 'ActivityCategory', id, body, ip, req?.user?.sub);
        return result;
    }

    @Delete('activity-categories/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'ลบหมวดหมู่กิจกรรม' })
    async deleteActivityCategory(@Param('id') id: string, @Request() req: any, @Ip() ip: string) {
        await this.base.prisma.activityCategory.delete({ where: { id } });
        await this.base.logAction('DELETE', 'ActivityCategory', id, null, ip, req?.user?.sub);
        return { success: true };
    }
}
