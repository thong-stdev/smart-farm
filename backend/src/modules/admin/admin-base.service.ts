import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { EncryptionService } from '../../common/encryption.service';

/**
 * AdminBaseService - Base service สำหรับ Admin controllers
 * รวม dependencies และ helper methods ที่ใช้ร่วมกัน
 */
@Injectable()
export class AdminBaseService {
    // รายการ fields ที่ต้องเข้ารหัส
    readonly secretFields = [
        'lineClientSecret',
        'googleClientSecret',
        'facebookAppSecret',
    ];

    constructor(
        readonly prisma: PrismaService,
        readonly auditLogService: AuditLogService,
        readonly encryptionService: EncryptionService,
    ) { }

    /**
     * Helper สำหรับ log Admin actions
     */
    async logAction(
        action: string,
        target: string,
        targetId: string | undefined,
        data: any,
        ip: string,
        actorId?: string,
    ) {
        await this.auditLogService.log({
            actorType: 'ADMIN',
            actorId: actorId,
            action,
            target,
            targetId,
            data,
            ip,
        });
    }
}
