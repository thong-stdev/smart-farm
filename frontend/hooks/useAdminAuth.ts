"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface Admin {
    id: string;
    username: string;
    name?: string;
    role: string;
}

export function useAdminAuth() {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [admin, setAdmin] = useState<Admin | null>(null);

    useEffect(() => {
        checkAuth();
    }, [pathname]);

    const checkAuth = () => {
        const token = localStorage.getItem('adminToken');
        const isAdmin = localStorage.getItem('isAdmin');
        const adminData = localStorage.getItem('admin');

        if (!token || isAdmin !== 'true') {
            setIsAuthenticated(false);
            setAdmin(null);
            setIsLoading(false);

            // ถ้าไม่ใช่หน้า login ให้ redirect
            if (pathname !== '/admin/login') {
                router.replace('/admin/login');
            }
            return;
        }

        // มี token และเป็น admin
        if (adminData) {
            try {
                setAdmin(JSON.parse(adminData));
            } catch {
                setAdmin(null);
            }
        }
        setIsAuthenticated(true);
        setIsLoading(false);
    };

    const logout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
        localStorage.removeItem('isAdmin');
        setIsAuthenticated(false);
        setAdmin(null);
        router.replace('/admin/login');
    };

    return {
        isLoading,
        isAuthenticated,
        admin,
        logout,
    };
}
