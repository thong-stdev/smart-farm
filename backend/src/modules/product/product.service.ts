import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

import { CreateProductDto, UpdateProductDto } from '@shared/types/product';
export { CreateProductDto, UpdateProductDto };

@Injectable()
export class ProductService {
    constructor(private prisma: PrismaService) { }

    // ==================== สินค้า ====================

    /**
     * สร้างสินค้าใหม่
     */
    async createProduct(dto: CreateProductDto) {
        return this.prisma.product.create({
            data: dto,
            include: {
                category: true,
                type: true,
                brand: true,
            },
        });
    }

    /**
     * ดึงรายการสินค้าทั้งหมด
     */
    async findAllProducts(categoryId?: string, typeId?: string, brandId?: string) {
        const where: any = {};
        if (categoryId) where.categoryId = categoryId;
        if (typeId) where.typeId = typeId;
        if (brandId) where.brandId = brandId;

        return this.prisma.product.findMany({
            where,
            include: {
                category: true,
                type: true,
                brand: true,
            },
            orderBy: { name: 'asc' },
        });
    }

    /**
     * ค้นหาสินค้า (Search)
     */
    async searchProducts(query: string) {
        return this.prisma.product.findMany({
            where: {
                name: { contains: query } // Default is case-insensitive in Postgres if using correct collation, but usually 'contains' is enough
            },
            include: {
                category: true,
                type: true,
                brand: true,
            },
            take: 20, // Limit results
            orderBy: { name: 'asc' },
        });
    }

    /**
     * ดึงสินค้าตาม ID
     */
    async findProductById(id: string) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
                type: true,
                brand: true,
            },
        });

        if (!product) {
            throw new NotFoundException('ไม่พบสินค้า');
        }

        return product;
    }

    /**
     * อัปเดตสินค้า
     */
    async updateProduct(id: string, dto: UpdateProductDto) {
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product) {
            throw new NotFoundException('ไม่พบสินค้า');
        }

        return this.prisma.product.update({
            where: { id },
            data: dto,
            include: {
                category: true,
                type: true,
                brand: true,
            },
        });
    }

    /**
     * ลบสินค้า
     */
    async deleteProduct(id: string) {
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product) {
            throw new NotFoundException('ไม่พบสินค้า');
        }
        return this.prisma.product.delete({ where: { id } });
    }

    // ==================== หมวดหมู่สินค้า ====================

    async findAllCategories() {
        return this.prisma.productCategory.findMany({
            include: {
                _count: { select: { products: true, types: true } },
            },
            orderBy: { name: 'asc' },
        });
    }

    async createCategory(name: string) {
        return this.prisma.productCategory.create({
            data: { name },
        });
    }

    // ==================== ประเภทสินค้า ====================

    async findTypesByCategory(categoryId: string) {
        return this.prisma.productType.findMany({
            where: { categoryId },
            include: {
                _count: { select: { products: true } },
            },
            orderBy: { name: 'asc' },
        });
    }

    async createType(name: string, categoryId: string) {
        return this.prisma.productType.create({
            data: { name, categoryId },
        });
    }

    // ==================== ยี่ห้อ ====================

    async findAllBrands() {
        return this.prisma.productBrand.findMany({
            include: {
                _count: { select: { products: true } },
            },
            orderBy: { name: 'asc' },
        });
    }

    async createBrand(name: string) {
        return this.prisma.productBrand.create({
            data: { name },
        });
    }
}
