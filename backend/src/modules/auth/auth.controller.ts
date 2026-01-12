import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus, Ip } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { AuthService, LoginDto, RegisterDto, AdminLoginDto } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuditLogService } from '../audit-log/audit-log.service';

@ApiTags('การยืนยันตัวตน')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly auditLogService: AuditLogService,
    ) { }

    @Post('register')
    @ApiOperation({ summary: 'ลงทะเบียนด้วย Email' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
                email: { type: 'string', example: 'user@example.com' },
                password: { type: 'string', example: 'password123' },
                displayName: { type: 'string', example: 'ชื่อผู้ใช้' },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'ลงทะเบียนสำเร็จ' })
    async register(@Body() dto: RegisterDto, @Ip() ip: string) {
        const result = await this.authService.register(dto);

        // บันทึก Audit Log
        await this.auditLogService.log({
            actorType: 'USER',
            actorId: result.user.id,
            action: 'REGISTER',
            target: 'User',
            targetId: result.user.id,
            data: { email: dto.email },
            ip,
        });

        return result;
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'เข้าสู่ระบบด้วย Email' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
                email: { type: 'string', example: 'user@example.com' },
                password: { type: 'string', example: 'password123' },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'เข้าสู่ระบบสำเร็จ' })
    async login(@Body() dto: LoginDto, @Ip() ip: string) {
        const result = await this.authService.login(dto);

        // บันทึก Audit Log
        await this.auditLogService.log({
            actorType: 'USER',
            actorId: result.user.id,
            action: 'LOGIN',
            target: 'User',
            targetId: result.user.id,
            data: { email: dto.email, provider: 'EMAIL' },
            ip,
        });

        return result;
    }

    @Post('line/mock')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Mock LINE Login (สำหรับ Development)' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['lineUserId'],
            properties: {
                lineUserId: { type: 'string', example: 'U1234567890abcdef' },
                displayName: { type: 'string', example: 'LINE User' },
            },
        },
    })
    async mockLineLogin(@Body() body: { lineUserId: string; displayName?: string }, @Ip() ip: string) {
        const result = await this.authService.mockLineLogin(body.lineUserId, body.displayName);

        // บันทึก Audit Log
        await this.auditLogService.log({
            actorType: 'USER',
            actorId: result.user.id,
            action: 'LOGIN',
            target: 'User',
            targetId: result.user.id,
            data: { provider: 'LINE' },
            ip,
        });

        return result;
    }

    @Post('google/mock')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Mock Google Login (สำหรับ Development)' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['googleId'],
            properties: {
                googleId: { type: 'string', example: '123456789012345678901' },
                email: { type: 'string', example: 'user@gmail.com' },
                displayName: { type: 'string', example: 'Google User' },
            },
        },
    })
    async mockGoogleLogin(
        @Body() body: { googleId: string; email?: string; displayName?: string },
        @Ip() ip: string,
    ) {
        const result = await this.authService.mockGoogleLogin(body.googleId, body.email, body.displayName);

        // บันทึก Audit Log
        await this.auditLogService.log({
            actorType: 'USER',
            actorId: result.user.id,
            action: 'LOGIN',
            target: 'User',
            targetId: result.user.id,
            data: { provider: 'GOOGLE', email: body.email },
            ip,
        });

        return result;
    }

    @Post('facebook/mock')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Mock Facebook Login (สำหรับ Development)' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['facebookId'],
            properties: {
                facebookId: { type: 'string', example: 'fb123456789' },
                email: { type: 'string', example: 'user@facebook.com' },
                displayName: { type: 'string', example: 'Facebook User' },
            },
        },
    })
    async mockFacebookLogin(
        @Body() body: { facebookId: string; email?: string; displayName?: string },
        @Ip() ip: string,
    ) {
        const result = await this.authService.mockFacebookLogin(body.facebookId, body.email, body.displayName);

        // บันทึก Audit Log
        await this.auditLogService.log({
            actorType: 'USER',
            actorId: result.user.id,
            action: 'LOGIN',
            target: 'User',
            targetId: result.user.id,
            data: { provider: 'FACEBOOK', email: body.email },
            ip,
        });

        return result;
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'ดึงข้อมูลผู้ใช้ปัจจุบัน' })
    @ApiResponse({ status: 200, description: 'ข้อมูลผู้ใช้' })
    async getMe(@Request() req: any) {
        return this.authService.getCurrentUser(req.user.sub);
    }

    @Post('admin/login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'เข้าสู่ระบบ Admin' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['username', 'password'],
            properties: {
                username: { type: 'string', example: 'admin' },
                password: { type: 'string', example: 'admin123' },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'เข้าสู่ระบบสำเร็จ' })
    async adminLogin(@Body() dto: AdminLoginDto, @Ip() ip: string) {
        const result = await this.authService.adminLogin(dto);

        // บันทึก Audit Log
        await this.auditLogService.log({
            actorType: 'ADMIN',
            actorId: result.admin.id,
            action: 'ADMIN_LOGIN',
            target: 'Admin',
            targetId: result.admin.id,
            data: { username: dto.username },
            ip,
        });

        return result;
    }
}
