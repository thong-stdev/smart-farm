// UI Store - Zustand

import { create } from 'zustand';

interface UIState {
    // Sidebar
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;

    // Theme
    theme: 'light' | 'dark' | 'system';
    setTheme: (theme: 'light' | 'dark' | 'system') => void;

    // Loading
    isGlobalLoading: boolean;
    setGlobalLoading: (loading: boolean) => void;

    // Toast/Notification
    toast: { message: string; type: 'success' | 'error' | 'info' } | null;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    hideToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    // Sidebar
    isSidebarOpen: false,
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setSidebarOpen: (open) => set({ isSidebarOpen: open }),

    // Theme
    theme: 'light',
    setTheme: (theme) => set({ theme }),

    // Loading
    isGlobalLoading: false,
    setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),

    // Toast
    toast: null,
    showToast: (message, type = 'info') => {
        set({ toast: { message, type } });
        // Auto hide after 3 seconds
        setTimeout(() => set({ toast: null }), 3000);
    },
    hideToast: () => set({ toast: null }),
}));

export default useUIStore;
