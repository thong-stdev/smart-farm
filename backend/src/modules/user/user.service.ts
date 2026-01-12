import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

import { UpdateUserDto, UpdateSettingsDto } from '@shared/types/user';
export { UpdateUserDto, UpdateSettingsDto };

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    /**
     * ดึงข้อมูลผู้ใช้ตาม ID
     */
    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                settings: true,
                providers: {
                    select: {
                        provider: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        plots: true,
                        activities: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('ไม่พบผู้ใช้');
        }

        return user;
    }

    /**
     * อัปเดตข้อมูลผู้ใช้
     */
    async update(id: string, dto: UpdateUserDto) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('ไม่พบผู้ใช้');
        }

        return this.prisma.user.update({
            where: { id },
            data: dto,
            include: {
                settings: true,
            },
        });
    }

    /**
     * อัปเดตการตั้งค่าผู้ใช้
     */
    async updateSettings(userId: string, dto: UpdateSettingsDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('ไม่พบผู้ใช้');
        }

        return this.prisma.userSetting.upsert({
            where: { userId },
            update: dto,
            create: {
                userId,
                language: dto.language || 'th',
                timezone: dto.timezone || 'Asia/Bangkok',
                unit: dto.unit || 'METRIC',
            },
        });
    }

    /**
     * ลบบัญชีผู้ใช้ (Soft Delete)
     */
    async softDelete(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('ไม่พบผู้ใช้');
        }

        return this.prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }


    /**
     * เชื่อมต่อบัญชี Social
     */
    async linkProvider(userId: string, dto: { provider: any, providerUid: string, email?: string }) {
        // Check if this provider account is already linked to SOMEONE
        const existing = await this.prisma.authProvider.findUnique({
            where: {
                provider_providerUid: {
                    provider: dto.provider,
                    providerUid: dto.providerUid
                }
            }
        });

        if (existing) {
            if (existing.userId === userId) {
                return existing; // Already linked to this user
            }
            throw new Error('บัญชีนี้ถูกเชื่อมต่อกับผู้ใช้อื่นแล้ว');
        }

        return this.prisma.authProvider.create({
            data: {
                userId,
                provider: dto.provider,
                providerUid: dto.providerUid,
                email: dto.email
            }
        });
    }

    /**
     * ยกเลิกการเชื่อมต่อบัญชี
     */
    async unlinkProvider(userId: string, provider: any) {
        // Count providers
        const count = await this.prisma.authProvider.count({
            where: { userId }
        });

        if (count <= 1) {
            throw new Error('ไม่สามารถยกเลิกการเชื่อมต่อบัญชีสุดท้ายได้');
        }

        return this.prisma.authProvider.deleteMany({
            where: {
                userId,
                provider
            }
        });
    }
}
