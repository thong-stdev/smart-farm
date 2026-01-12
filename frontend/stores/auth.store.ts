// Auth Store - Zustand

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService, { User, AuthResponse, LoginDto, RegisterDto } from '@/services/auth';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (data: LoginDto) => Promise<void>;
    register: (data: RegisterDto) => Promise<void>;
    lineLogin: (lineUserId: string, displayName?: string) => Promise<void>;
    logout: () => void;
    setUser: (user: User | null) => void;
    clearError: () => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (data: LoginDto) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await authService.login(data);
                    set({
                        user: response.user as User,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            register: async (data: RegisterDto) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await authService.register(data);
                    set({
                        user: response.user as User,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            lineLogin: async (lineUserId: string, displayName?: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await authService.lineLogin(lineUserId, displayName);
                    set({
                        user: response.user as User,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            logout: () => {
                authService.logout();
                set({ user: null, isAuthenticated: false });
            },

            setUser: (user: User | null) => {
                set({ user, isAuthenticated: !!user });
            },

            clearError: () => {
                set({ error: null });
            },

            checkAuth: async () => {
                if (!authService.isAuthenticated()) {
                    set({ user: null, isAuthenticated: false });
                    return;
                }

                try {
                    const user = await authService.getCurrentUser();
                    set({ user, isAuthenticated: true });
                } catch {
                    set({ user: null, isAuthenticated: false });
                    authService.logout();
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);

export default useAuthStore;
