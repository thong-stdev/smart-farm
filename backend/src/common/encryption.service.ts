import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Encryption Service - เข้ารหัส/ถอดรหัส Secret Keys
 * ใช้ AES-256-GCM encryption
 */
@Injectable()
export class EncryptionService {
    private readonly algorithm = 'aes-256-gcm';
    private readonly keyLength = 32; // 256 bits
    private readonly ivLength = 16;  // 128 bits
    private readonly tagLength = 16; // 128 bits
    private encryptionKey: Buffer;

    constructor(private configService: ConfigService) {
        // ใช้ ENCRYPTION_KEY หรือสร้างจาก JWT_SECRET
        const key = this.configService.get<string>('ENCRYPTION_KEY')
            || this.configService.get<string>('JWT_SECRET')
            || 'default-secret-key-change-me';

        // สร้าง 32-byte key จาก secret
        this.encryptionKey = crypto.scryptSync(key, 'smart-farm-salt', this.keyLength);
    }

    /**
     * เข้ารหัสข้อความ
     */
    encrypt(plainText: string): string {
        if (!plainText) return '';

        try {
            // สร้าง random IV
            const iv = crypto.randomBytes(this.ivLength);

            // สร้าง cipher
            const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

            // เข้ารหัส
            let encrypted = cipher.update(plainText, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            // ดึง auth tag
            const tag = cipher.getAuthTag();

            // รวม iv + tag + encrypted เป็น string เดียว (base64)
            const combined = Buffer.concat([iv, tag, Buffer.from(encrypted, 'hex')]);
            return combined.toString('base64');
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt data');
        }
    }

    /**
     * ถอดรหัสข้อความ
     */
    decrypt(encryptedText: string): string {
        if (!encryptedText) return '';

        try {
            // แปลงจาก base64
            const combined = Buffer.from(encryptedText, 'base64');

            // แยก iv, tag, encrypted
            const iv = combined.subarray(0, this.ivLength);
            const tag = combined.subarray(this.ivLength, this.ivLength + this.tagLength);
            const encrypted = combined.subarray(this.ivLength + this.tagLength);

            // สร้าง decipher
            const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
            decipher.setAuthTag(tag);

            // ถอดรหัส
            let decrypted = decipher.update(encrypted);
            decrypted = Buffer.concat([decrypted, decipher.final()]);

            return decrypted.toString('utf8');
        } catch (error) {
            console.error('Decryption error:', error);
            // ถ้าถอดรหัสไม่ได้ อาจเป็นค่าเก่าที่ยังไม่ได้เข้ารหัส
            return encryptedText;
        }
    }

    /**
     * ตรวจสอบว่าข้อความเข้ารหัสแล้วหรือไม่
     */
    isEncrypted(text: string): boolean {
        if (!text) return false;

        try {
            const combined = Buffer.from(text, 'base64');
            // ตรวจสอบความยาวขั้นต่ำ (iv + tag + ข้อมูลอย่างน้อย 1 byte)
            return combined.length > this.ivLength + this.tagLength;
        } catch {
            return false;
        }
    }

    /**
     * Mask secret สำหรับแสดงผล (เช่น sk-****1234)
     */
    maskSecret(secret: string): string {
        if (!secret || secret.length < 8) return '••••••••';

        const prefix = secret.substring(0, 4);
        const suffix = secret.substring(secret.length - 4);
        return `${prefix}••••${suffix}`;
    }
}
