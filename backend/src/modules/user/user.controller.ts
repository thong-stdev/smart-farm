import { Controller, Get, Post, Patch, Body, Delete, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UserService, UpdateUserDto, UpdateSettingsDto } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('ผู้ใช้')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get('profile')
    @ApiOperation({ summary: 'ดึงข้อมูลโปรไฟล์ตัวเอง' })
    @ApiResponse({ status: 200, description: 'ข้อมูลผู้ใช้' })
    async getProfile(@Request() req: any) {
        return this.userService.findById(req.user.sub);
    }

    @Patch('profile')
    @ApiOperation({ summary: 'แก้ไขข้อมูลโปรไฟล์' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                displayName: { type: 'string', example: 'ชื่อใหม่' },
                firstName: { type: 'string', example: 'ชื่อจริง' },
                lastName: { type: 'string', example: 'นามสกุล' },
                address: { type: 'string', example: 'ที่อยู่' },
            },
        },
    })
    async updateProfile(@Request() req: any, @Body() dto: UpdateUserDto) {
        return this.userService.update(req.user.sub, dto);
    }

    @Patch('settings')
    @ApiOperation({ summary: 'แก้ไขการตั้งค่า' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                language: { type: 'string', example: 'th' },
                timezone: { type: 'string', example: 'Asia/Bangkok' },
                unit: { type: 'string', example: 'METRIC' },
            },
        },
    })
    async updateSettings(@Request() req: any, @Body() dto: UpdateSettingsDto) {
        return this.userService.updateSettings(req.user.sub, dto);
    }

    @Post('providers')
    @ApiOperation({ summary: 'เชื่อมต่อบัญชี Social' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['provider', 'providerUid'],
            properties: {
                provider: { type: 'string', enum: ['LINE', 'GOOGLE', 'FACEBOOK'], example: 'LINE' },
                providerUid: { type: 'string', example: 'U123456...' },
                email: { type: 'string', example: 'user@line.me' },
            },
        },
    })
    async linkProvider(@Request() req: any, @Body() dto: any) {
        try {
            return await this.userService.linkProvider(req.user.sub, dto);
        } catch (e: any) {
            throw new Error(e.message);
        }
    }

    @Delete('providers/:provider')
    @ApiOperation({ summary: 'ยกเลิกการเชื่อมต่อบัญชี' })
    @ApiParam({ name: 'provider', enum: ['LINE', 'GOOGLE', 'FACEBOOK'] })
    async unlinkProvider(@Request() req: any, @Param('provider') provider: string) {
        try {
            return await this.userService.unlinkProvider(req.user.sub, provider as any);
        } catch (e: any) {
            throw new Error(e.message);
        }
    }

    @Delete('account')
    @ApiOperation({ summary: 'ลบบัญชีผู้ใช้' })
    async deleteAccount(@Request() req: any) {
        return this.userService.softDelete(req.user.sub);
    }

    @Get(':id')
    @ApiOperation({ summary: 'ดึงข้อมูลผู้ใช้ตาม ID' })
    @ApiParam({ name: 'id', description: 'รหัสผู้ใช้' })
    async findById(@Param('id') id: string) {
        return this.userService.findById(id);
    }
}
