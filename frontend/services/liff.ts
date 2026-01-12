// LIFF Service - จัดการ LINE LIFF SDK

declare global {
    interface Window {
        liff: any;
    }
}

export interface LiffProfile {
    userId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
}

class LiffService {
    private liffId: string;
    private isInitialized: boolean = false;

    constructor() {
        this.liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID || '';
    }

    // ตรวจสอบว่าอยู่ใน LIFF environment หรือไม่
    isInLiffBrowser(): boolean {
        if (typeof window === 'undefined') return false;
        return window.liff?.isInClient() ?? false;
    }

    // Initialize LIFF
    async init(): Promise<void> {
        if (this.isInitialized) return;
        if (typeof window === 'undefined') return;

        // Mock mode สำหรับ development
        if (!this.liffId || this.liffId === 'mock') {
            console.log('🔔 LIFF running in mock mode');
            this.isInitialized = true;
            return;
        }

        try {
            // Load LIFF SDK
            if (!window.liff) {
                await this.loadLiffSdk();
            }

            await window.liff.init({ liffId: this.liffId });
            this.isInitialized = true;
            console.log('✅ LIFF initialized');
        } catch (error) {
            console.error('❌ LIFF init error:', error);
            throw error;
        }
    }

    // Load LIFF SDK dynamically
    private loadLiffSdk(): Promise<void> {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load LIFF SDK'));
            document.head.appendChild(script);
        });
    }

    // Login ผ่าน LINE
    async login(): Promise<void> {
        if (!this.isInitialized) await this.init();

        if (this.liffId && this.liffId !== 'mock' && window.liff) {
            if (!window.liff.isLoggedIn()) {
                window.liff.login();
            }
        }
    }

    // ดึง Profile จาก LINE
    async getProfile(): Promise<LiffProfile | null> {
        if (!this.isInitialized) await this.init();

        // Mock mode
        if (!this.liffId || this.liffId === 'mock') {
            return {
                userId: `mock_${Date.now()}`,
                displayName: 'Mock LINE User',
                pictureUrl: undefined,
            };
        }

        try {
            if (window.liff?.isLoggedIn()) {
                return await window.liff.getProfile();
            }
            return null;
        } catch (error) {
            console.error('❌ Get profile error:', error);
            return null;
        }
    }

    // ปิด LIFF browser
    closeWindow(): void {
        if (this.isInLiffBrowser() && window.liff) {
            window.liff.closeWindow();
        }
    }

    // ส่งข้อความไปยัง chat
    async sendMessage(messages: any[]): Promise<void> {
        if (!this.isInLiffBrowser()) return;

        try {
            await window.liff.sendMessages(messages);
        } catch (error) {
            console.error('❌ Send message error:', error);
        }
    }

    // Share target picker
    async shareTargetPicker(messages: any[]): Promise<void> {
        if (!window.liff?.isApiAvailable('shareTargetPicker')) return;

        try {
            await window.liff.shareTargetPicker(messages);
        } catch (error) {
            console.error('❌ Share error:', error);
        }
    }
}

export const liffService = new LiffService();
export default liffService;
