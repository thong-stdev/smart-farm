'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Liff } from '@line/liff';

interface LiffProfile {
    userId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
}

interface UseLiffReturn {
    liff: Liff | null;
    isLoggedIn: boolean;
    isInClient: boolean;
    isReady: boolean;
    error: string | null;
    profile: LiffProfile | null;
    login: () => void;
    logout: () => void;
    sendMessage: (message: string) => Promise<void>;
    closeWindow: () => void;
}

/**
 * useLiff - Hook สำหรับใช้งาน LIFF SDK ใน LINE App
 */
export function useLiff(): UseLiffReturn {
    const [liff, setLiff] = useState<Liff | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isInClient, setIsInClient] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [profile, setProfile] = useState<LiffProfile | null>(null);

    // Initialize LIFF
    useEffect(() => {
        const initLiff = async () => {
            try {
                const liffModule = await import('@line/liff');
                const liffInstance = liffModule.default;

                const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

                if (!liffId) {
                    console.warn('LIFF_ID not configured, LIFF features disabled');
                    setError('LIFF_ID ไม่ได้ตั้งค่า');
                    setIsReady(true);
                    return;
                }

                await liffInstance.init({ liffId });

                setLiff(liffInstance);
                setIsInClient(liffInstance.isInClient());
                setIsLoggedIn(liffInstance.isLoggedIn());
                setIsReady(true);

                // ดึง profile ถ้า login แล้ว
                if (liffInstance.isLoggedIn()) {
                    try {
                        const userProfile = await liffInstance.getProfile();
                        setProfile(userProfile);
                    } catch (e) {
                        console.error('Failed to get profile:', e);
                    }
                }
            } catch (e: any) {
                console.error('LIFF init error:', e);
                setError(e.message || 'LIFF initialization failed');
                setIsReady(true);
            }
        };

        initLiff();
    }, []);

    // Login
    const login = useCallback(() => {
        if (!liff) return;

        if (!liff.isLoggedIn()) {
            liff.login();
        }
    }, [liff]);

    // Logout
    const logout = useCallback(() => {
        if (!liff) return;

        if (liff.isLoggedIn()) {
            liff.logout();
            window.location.reload();
        }
    }, [liff]);

    // ส่งข้อความไป LINE Chat
    const sendMessage = useCallback(async (message: string) => {
        if (!liff || !liff.isInClient()) {
            console.warn('Cannot send message: not in LINE client');
            return;
        }

        await liff.sendMessages([
            {
                type: 'text',
                text: message,
            },
        ]);
    }, [liff]);

    // ปิดหน้าต่าง LIFF
    const closeWindow = useCallback(() => {
        if (!liff) return;
        liff.closeWindow();
    }, [liff]);

    return {
        liff,
        isLoggedIn,
        isInClient,
        isReady,
        error,
        profile,
        login,
        logout,
        sendMessage,
        closeWindow,
    };
}
