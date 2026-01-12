import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

export interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
}

export interface UploadResult {
    url: string;
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
}

@Injectable()
export class UploadService {
    private readonly uploadDir = 'uploads';

    constructor() {
        // สร้าง folder uploads ถ้ายังไม่มี
        const dirs = ['uploads', 'uploads/images', 'uploads/activities', 'uploads/plots'];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * อัปโหลดไฟล์รูปภาพ
     */
    async uploadImage(file: UploadedFile, folder: string = 'images'): Promise<UploadResult> {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
            throw new Error('ประเภทไฟล์ไม่ถูกต้อง (รองรับ: JPEG, PNG, GIF, WebP)');
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error('ไฟล์ใหญ่เกินไป (สูงสุด 5MB)');
        }

        // Generate unique filename
        const ext = path.extname(file.originalname);
        const filename = `${randomUUID()}${ext}`;
        const filePath = path.join(this.uploadDir, folder, filename);

        // Save file
        fs.writeFileSync(filePath, file.buffer);

        return {
            url: `/uploads/${folder}/${filename}`,
            filename,
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
        };
    }

    /**
     * อัปโหลดหลายไฟล์
     */
    async uploadMultiple(files: UploadedFile[], folder: string = 'images'): Promise<UploadResult[]> {
        const results: UploadResult[] = [];
        for (const file of files) {
            const result = await this.uploadImage(file, folder);
            results.push(result);
        }
        return results;
    }

    /**
     * ลบไฟล์
     */
    async deleteFile(url: string): Promise<boolean> {
        try {
            // url format: /uploads/folder/filename
            const filePath = path.join('.', url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Delete file error:', error);
            return false;
        }
    }

    /**
     * Validate Base64 image และบันทึก
     */
    async uploadBase64(base64Data: string, folder: string = 'images'): Promise<UploadResult> {
        // ตรวจสอบ format
        const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) {
            throw new Error('รูปแบบ Base64 ไม่ถูกต้อง');
        }

        const ext = matches[1];
        const data = matches[2];
        const buffer = Buffer.from(data, 'base64');

        // Validate size
        const maxSize = 5 * 1024 * 1024;
        if (buffer.length > maxSize) {
            throw new Error('ไฟล์ใหญ่เกินไป (สูงสุด 5MB)');
        }

        // Save file
        const filename = `${randomUUID()}.${ext}`;
        const filePath = path.join(this.uploadDir, folder, filename);
        fs.writeFileSync(filePath, buffer);

        return {
            url: `/uploads/${folder}/${filename}`,
            filename,
            originalName: filename,
            size: buffer.length,
            mimeType: `image/${ext}`,
        };
    }
}
