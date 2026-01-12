import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export type AuditActorType = 'USER' | 'ADMIN' | 'SYSTEM';

export interface CreateAuditLogDto {
    actorType: AuditActorType;
    actorId?: string;
    action: string;
    target: string;
    targetId?: string;
    data?: any;
    ip?: string;
}

@Injectable()
export class AuditLogService {
    constructor(private prisma: PrismaService) { }

    /**
     * บันทึก Audit Log
     */
    async log(dto: CreateAuditLogDto) {
        return this.prisma.auditLog.create({
            data: {
                actorType: dto.actorType,
                actorId: dto.actorId,
                action: dto.action,
                target: dto.target,
                targetId: dto.targetId,
                data: dto.data,
                ip: dto.ip,
            },
        });
    }

    /**
     * ดึง Audit Logs (สำหรับ Admin)
     */
    async findAll(options?: {
        page?: number;
        limit?: number;
        actorType?: AuditActorType;
        target?: string;
        action?: string;
    }) {
        const page = options?.page || 1;
        const limit = options?.limit || 50;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (options?.actorType) where.actorType = options.actorType;
        if (options?.target) where.target = options.target;
        if (options?.action) where.action = { contains: options.action, mode: 'insensitive' };

        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.auditLog.count({ where }),
        ]);

        return {
            data: logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * ดึง Audit Log ตาม target
     */
    async findByTarget(target: string, targetId: string) {
        return this.prisma.auditLog.findMany({
            where: { target, targetId },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
}
