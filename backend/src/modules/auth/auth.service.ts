import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// DTOs
export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterDto {
    email: string;
    password: string;
    displayName?: string;
}

export interface OAuthLoginDto {
    provider: AuthType;
    providerUid: string;
    email?: string;
    displayName?: string;
    pictureUrl?: string;
}

export interface AdminLoginDto {
    username: string;
    password: string;
}

export interface JwtPayload {
    sub: string;
    email?: string;
    isAdmin?: boolean;
}

export interface AuthResponse {
    accessToken: string;
    user: {
        id: string;
        displayName?: string;
        email?: string;
        pictureUrl?: string;
    };
}

export interface AdminAuthResponse {
    accessToken: string;
    admin: {
        id: string;
        username: string;
        name?: string;
        role: string;
    };
}

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    /**
     * ลงทะเบียนด้วย Email
     */
    async register(dto: RegisterDto): Promise<AuthResponse> {
        // ตรวจสอบว่า email ซ้ำหรือไม่
        const existingProvider = await this.prisma.authProvider.findFirst({
            where: {
                provider: AuthType.EMAIL,
                email: dto.email,
            },
        });

        if (existingProvider) {
            throw new UnauthorizedException('อีเมลนี้ถูกใช้งานแล้ว');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // สร้าง User
        const user = await this.prisma.user.create({
            data: {
                displayName: dto.displayName,
                providers: {
                    create: {
                        provider: AuthType.EMAIL,
                        providerUid: hashedPassword, // เก็บ password ใน providerUid
                        email: dto.email,
                    },
                },
                settings: {
                    create: {
                        language: 'th',
                        timezone: 'Asia/Bangkok',
                    },
                },
            },
        });

        return this.generateAuthResponse(user.id, dto.email);
    }

    /**
     * เข้าสู่ระบบด้วย Email
     */
    async login(dto: LoginDto): Promise<AuthResponse> {
        const provider = await this.prisma.authProvider.findFirst({
            where: {
                provider: AuthType.EMAIL,
                email: dto.email,
            },
            include: {
                user: true,
            },
        });

        if (!provider) {
            throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        }

        // ตรวจสอบ password
        const isPasswordValid = await bcrypt.compare(dto.password, provider.providerUid);
        if (!isPasswordValid) {
            throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        }

        return this.generateAuthResponse(provider.user.id, dto.email);
    }

    /**
     * เข้าสู่ระบบด้วย OAuth (LINE, Google)
     */
    async oauthLogin(dto: OAuthLoginDto): Promise<AuthResponse> {
        // ค้นหา provider ที่มีอยู่
        let provider = await this.prisma.authProvider.findUnique({
            where: {
                provider_providerUid: {
                    provider: dto.provider,
                    providerUid: dto.providerUid,
                },
            },
            include: {
                user: true,
            },
        });

        if (provider) {
            // อัปเดตข้อมูลผู้ใช้
            await this.prisma.user.update({
                where: { id: provider.user.id },
                data: {
                    displayName: dto.displayName || provider.user.displayName,
                    pictureUrl: dto.pictureUrl || provider.user.pictureUrl,
                },
            });

            return this.generateAuthResponse(provider.user.id, dto.email);
        }

        // สร้าง User ใหม่
        const user = await this.prisma.user.create({
            data: {
                displayName: dto.displayName,
                pictureUrl: dto.pictureUrl,
                providers: {
                    create: {
                        provider: dto.provider,
                        providerUid: dto.providerUid,
                        email: dto.email,
                    },
                },
                settings: {
                    create: {
                        language: 'th',
                        timezone: 'Asia/Bangkok',
                    },
                },
            },
        });

        return this.generateAuthResponse(user.id, dto.email);
    }

    /**
     * Mock LINE Login (สำหรับ Development)
     */
    async mockLineLogin(lineUserId: string, displayName?: string): Promise<AuthResponse> {
        return this.oauthLogin({
            provider: AuthType.LINE,
            providerUid: lineUserId,
            displayName: displayName || `LINE User ${lineUserId.substring(0, 6)}`,
        });
    }

    /**
     * Mock Google Login (สำหรับ Development)
     */
    async mockGoogleLogin(googleId: string, email?: string, displayName?: string): Promise<AuthResponse> {
        return this.oauthLogin({
            provider: AuthType.GOOGLE,
            providerUid: googleId,
            email: email,
            displayName: displayName || `Google User`,
        });
    }

    /**
     * Mock Facebook Login (สำหรับ Development)
     */
    async mockFacebookLogin(facebookId: string, email?: string, displayName?: string): Promise<AuthResponse> {
        return this.oauthLogin({
            provider: AuthType.FACEBOOK,
            providerUid: facebookId,
            email: email,
            displayName: displayName || `Facebook User`,
        });
    }

    /**
     * ดึงข้อมูลผู้ใช้ปัจจุบัน
     */
    async getCurrentUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                settings: true,
                providers: {
                    select: {
                        provider: true,
                        email: true,
                    },
                },
            },
        });

        if (!user) {
            throw new UnauthorizedException('ไม่พบผู้ใช้');
        }

        return user;
    }

    /**
     * สร้าง Auth Response พร้อม JWT Token
     */
    private async generateAuthResponse(userId: string, email?: string): Promise<AuthResponse> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        const payload: JwtPayload = {
            sub: userId,
            email: email,
        };

        return {
            accessToken: this.jwtService.sign(payload),
            user: {
                id: userId,
                displayName: user?.displayName || undefined,
                email: email,
                pictureUrl: user?.pictureUrl || undefined,
            },
        };
    }

    /**
     * Admin Login
     */
    async adminLogin(dto: AdminLoginDto): Promise<AdminAuthResponse> {
        const admin = await this.prisma.admin.findUnique({
            where: { username: dto.username },
        });

        if (!admin) {
            throw new UnauthorizedException('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, admin.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        }

        const payload: JwtPayload = {
            sub: admin.id,
            isAdmin: true,
        };

        return {
            accessToken: this.jwtService.sign(payload),
            admin: {
                id: admin.id,
                username: admin.username,
                name: admin.name || undefined,
                role: admin.role,
            },
        };
    }
}
