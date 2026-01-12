"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
    Sprout,
    LayoutDashboard,
    MapPin,
    ClipboardList,
    BarChart3,
    Package,
    Settings,
    LogOut,
    Menu,
    X,
    User,
    ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/layout/notification-bell";

interface User {
    id: string;
    displayName?: string;
    email?: string;
    pictureUrl?: string;
}

const navItems = [
    { href: "/web/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
    { href: "/web/plots", label: "แปลงเกษตร", icon: MapPin },
    { href: "/web/activities", label: "กิจกรรม", icon: ClipboardList },
    { href: "/web/reports", label: "รายงาน", icon: BarChart3 },
    { href: "/web/products", label: "สินค้า/วัสดุ", icon: Package },
];

export default function WebLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // ตรวจสอบว่า login แล้วหรือยัง
        const token = localStorage.getItem("accessToken");
        const userData = localStorage.getItem("user");

        if (!token) {
            router.push("/auth/login");
            return;
        }

        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        router.push("/auth/login");
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-50 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg gradient-farm flex items-center justify-center">
                            <Sprout className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-farm-green-800">Smart Farm</span>
                    </div>
                </div>
            </header>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 h-full w-64 bg-white border-r z-50 transform transition-transform duration-200",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Logo */}
                <div className="h-16 border-b flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl gradient-farm flex items-center justify-center">
                            <Sprout className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-bold text-lg text-farm-green-800">Smart Farm</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden p-1 hover:bg-gray-100 rounded"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Nav Items */}
                <nav className="p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsSidebarOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                                    isActive
                                        ? "bg-farm-green-50 text-farm-green-700 font-medium"
                                        : "text-gray-600 hover:bg-gray-100"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                    <Link
                        href="/web/profile"
                        className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <User className="w-5 h-5" />
                        โปรไฟล์
                    </Link>
                    <Link
                        href="/web/settings"
                        className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Settings className="w-5 h-5" />
                        ตั้งค่า
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        ออกจากระบบ
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
                {/* Top Bar */}
                <header className="hidden lg:flex h-16 bg-white border-b items-center justify-between px-6">
                    <div>
                        {/* Breadcrumb could go here */}
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center gap-4">
                        <NotificationBell />

                        <div className="relative">
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <div className="w-8 h-8 rounded-full bg-farm-green-100 flex items-center justify-center">
                                    {user?.pictureUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={user.pictureUrl} alt="" className="w-8 h-8 rounded-full" />
                                    ) : (
                                        <User className="w-4 h-4 text-farm-green-600" />
                                    )}
                                </div>
                                <span className="text-sm font-medium text-gray-700">
                                    {user?.displayName || user?.email || "ผู้ใช้"}
                                </span>
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            </button>

                            {isUserMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20 py-1">
                                        <Link
                                            href="/web/profile"
                                            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                                            onClick={() => setIsUserMenuOpen(false)}
                                        >
                                            <User className="w-4 h-4" />
                                            โปรไฟล์
                                        </Link>
                                        <Link
                                            href="/web/settings"
                                            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                                            onClick={() => setIsUserMenuOpen(false)}
                                        >
                                            <Settings className="w-4 h-4" />
                                            ตั้งค่า
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            ออกจากระบบ
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-6">{children}</div>
            </main>
        </div>
    );
}
