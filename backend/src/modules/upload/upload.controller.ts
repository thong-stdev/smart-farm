import { Controller, Post, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadService, UploadedFile as IUploadedFile } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
    constructor(private uploadService: UploadService) { }

    @Post('image')
    @ApiOperation({ summary: 'อัปโหลดรูปภาพ' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                folder: { type: 'string', description: 'โฟลเดอร์ (images, activities, plots)' },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadImage(
        @UploadedFile() file: IUploadedFile,
        @Body('folder') folder?: string,
    ) {
        return this.uploadService.uploadImage(file, folder || 'images');
    }

    @Post('images')
    @ApiOperation({ summary: 'อัปโหลดหลายรูปภาพ' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                files: { type: 'array', items: { type: 'string', format: 'binary' } },
                folder: { type: 'string' },
            },
        },
    })
    @UseInterceptors(FilesInterceptor('files', 10))
    async uploadMultiple(
        @UploadedFiles() files: IUploadedFile[],
        @Body('folder') folder?: string,
    ) {
        return this.uploadService.uploadMultiple(files, folder || 'images');
    }

    @Post('base64')
    @ApiOperation({ summary: 'อัปโหลดรูปภาพ Base64' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                image: { type: 'string', description: 'Base64 encoded image' },
                folder: { type: 'string' },
            },
        },
    })
    async uploadBase64(
        @Body('image') image: string,
        @Body('folder') folder?: string,
    ) {
        return this.uploadService.uploadBase64(image, folder || 'images');
    }

    @Delete()
    @ApiOperation({ summary: 'ลบไฟล์' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'URL ของไฟล์ที่ต้องการลบ' },
            },
        },
    })
    async deleteFile(@Body('url') url: string) {
        const success = await this.uploadService.deleteFile(url);
        return { success };
    }
}
