// Auth Service - จัดการ Authentication

import api from './api';

export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterDto {
    email: string;
    password: string;
    displayName?: string;
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

export interface User {
    id: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    pictureUrl?: string;
    settings?: {
        language: string;
        timezone: string;
        unit: string;
    };
}

class AuthService {
    // ลงทะเบียน
    async register(data: RegisterDto): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/register', data);
        this.saveAuth(response);
        return response;
    }

    // เข้าสู่ระบบ
    async login(data: LoginDto): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/login', data);
        this.saveAuth(response);
        return response;
    }

    // Mock LINE Login
    async lineLogin(lineUserId: string, displayName?: string): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/line/mock', {
            lineUserId,
            displayName,
        });
        this.saveAuth(response);
        return response;
    }

    // Mock Google Login
    async googleLogin(googleId: string, email?: string, displayName?: string): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/google/mock', {
            googleId,
            email,
            displayName,
        });
        this.saveAuth(response);
        return response;
    }

    // ดึงข้อมูลผู้ใช้ปัจจุบัน
    async getCurrentUser(): Promise<User> {
        return api.get<User>('/auth/me');
    }

    // ออกจากระบบ
    logout(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
        }
    }

    // ตรวจสอบว่า login แล้วหรือไม่
    isAuthenticated(): boolean {
        if (typeof window === 'undefined') return false;
        return !!localStorage.getItem('accessToken');
    }

    // ดึง token
    getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('accessToken');
    }

    // ดึงข้อมูลผู้ใช้จาก localStorage
    getUser(): User | null {
        if (typeof window === 'undefined') return null;
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    // บันทึก auth data
    private saveAuth(response: AuthResponse): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', response.accessToken);
            localStorage.setItem('user', JSON.stringify(response.user));
        }
    }
}

export const authService = new AuthService();
export default authService;
