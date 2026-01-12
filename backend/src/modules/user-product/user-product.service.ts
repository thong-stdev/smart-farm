import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

interface CreateUserProductDto {
    name: string;
    category: string;          // ปุ๋ย, ยา, เมล็ด, วัสดุ
    type?: string;             // ปุ๋ยเคมี, ปุ๋ยอินทรีย์
    productId?: string;        // อ้างอิง catalog (optional)
    quantity?: number;
    unit?: string;
    brand?: string;
    price?: number;
    note?: string;
}

interface UpdateUserProductDto extends Partial<CreateUserProductDto> { }

@Injectable()
export class UserProductService {
    constructor(private prisma: PrismaService) { }

    /**
     * ดึงรายการสินค้า/วัสดุ ของผู้ใช้
     */
    async findAll(userId: string, options?: { category?: string }) {
        return this.prisma.userProduct.findMany({
            where: {
                userId,
                ...(options?.category ? { category: options.category } : {}),
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        brand: { select: { name: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * ดึงสินค้า/วัสดุ ตาม ID
     */
    async findById(userId: string, id: string) {
        return this.prisma.userProduct.findFirst({
            where: { id, userId },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        description: true,
                        brand: { select: { name: true } },
                        category: { select: { name: true } },
                    },
                },
            },
        });
    }

    /**
     * เพิ่มสินค้า/วัสดุ ใหม่
     */
    async create(userId: string, data: CreateUserProductDto) {
        return this.prisma.userProduct.create({
            data: {
                userId,
                name: data.name,
                category: data.category,
                type: data.type,
                productId: data.productId,
                quantity: data.quantity || 0,
                unit: data.unit,
                brand: data.brand,
                price: data.price,
                note: data.note,
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                    },
                },
            },
        });
    }

    /**
     * อัปเดตสินค้า/วัสดุ
     */
    async update(userId: string, id: string, data: UpdateUserProductDto) {
        // ตรวจสอบว่าเป็นของผู้ใช้
        const existing = await this.prisma.userProduct.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            throw new Error('ไม่พบสินค้า/วัสดุ');
        }

        return this.prisma.userProduct.update({
            where: { id },
            data,
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                    },
                },
            },
        });
    }

    /**
     * ลบสินค้า/วัสดุ
     */
    async delete(userId: string, id: string) {
        // ตรวจสอบว่าเป็นของผู้ใช้
        const existing = await this.prisma.userProduct.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            throw new Error('ไม่พบสินค้า/วัสดุ');
        }

        return this.prisma.userProduct.delete({
            where: { id },
        });
    }

    /**
     * อัปเดตจำนวน (เพิ่ม/ลด stock)
     */
    async updateQuantity(userId: string, id: string, amount: number) {
        const existing = await this.prisma.userProduct.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            throw new Error('ไม่พบสินค้า/วัสดุ');
        }

        return this.prisma.userProduct.update({
            where: { id },
            data: {
                quantity: (existing.quantity || 0) + amount,
            },
        });
    }

    /**
     * ค้นหาจาก catalog (Product) เพื่อเลือกใส่ inventory
     */
    async searchCatalog(query: string, category?: string) {
        return this.prisma.product.findMany({
            where: {
                isActive: true,
                AND: [
                    {
                        OR: [
                            { name: { contains: query, mode: 'insensitive' } },
                            { description: { contains: query, mode: 'insensitive' } },
                        ],
                    },
                    category ? { category: { name: { contains: category, mode: 'insensitive' } } } : {},
                ],
            },
            include: {
                brand: { select: { name: true } },
                category: { select: { name: true } },
            },
            take: 10,
        });
    }

    /**
     * ดึงสถิติ inventory ของผู้ใช้
     */
    async getStats(userId: string) {
        const items = await this.prisma.userProduct.groupBy({
            by: ['category'],
            where: { userId },
            _count: { id: true },
            _sum: { quantity: true },
        });

        return items.map((item) => ({
            category: item.category,
            count: item._count.id,
            totalQuantity: item._sum.quantity || 0,
        }));
    }
}
