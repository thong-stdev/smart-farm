"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
    Sprout,
    LayoutDashboard,
    Users,
    Package,
    Settings,
    LogOut,
    Menu,
    X,
    Shield,
    Loader2,
    Tag,
    Calendar,
    FileText,
    UserCog,
    Bell,
    Image,
    Database,
    Megaphone,
    BarChart3,
    Bot,
    Flag,
    Trophy,
    Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/hooks/useAdminAuth";

// จัดกลุ่ม Navigation
const navGroups = [
    {
        title: "หลัก",
        items: [
            { href: "/admin/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
            { href: "/admin/users", label: "ผู้ใช้งาน", icon: Users },
        ],
    },
    {
        title: "จัดการข้อมูล",
        items: [
            { href: "/admin/crops", label: "จัดการพืช", icon: Sprout },
            { href: "/admin/crop-plans", label: "แผนการปลูก", icon: Calendar },
            { href: "/admin/products", label: "สินค้า/วัสดุ", icon: Package },
            { href: "/admin/categories", label: "หมวดหมู่/แบรนด์", icon: Tag },
            { href: "/admin/activity-categories", label: "หมวดหมู่กิจกรรม", icon: Tag },
        ],
    },
    {
        title: "โฆษณา & Analytics",
        items: [
            { href: "/admin/promotions", label: "Sponsors", icon: Megaphone },
            { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
            { href: "/admin/rankings", label: "Rankings", icon: Trophy },
        ],
    },
    {
        title: "ระบบ",
        items: [
            { href: "/admin/jobs", label: "Background Jobs", icon: Briefcase },
            { href: "/admin/ai-usage", label: "AI Usage", icon: Bot },
            { href: "/admin/feature-flags", label: "Feature Flags", icon: Flag },
            { href: "/admin/notifications", label: "แจ้งเตือน", icon: Bell },
            { href: "/admin/reports", label: "รายงาน", icon: FileText },
        ],
    },
    {
        title: "ตั้งค่า",
        items: [
            { href: "/admin/media", label: "จัดการไฟล์", icon: Image },
            { href: "/admin/backup", label: "สำรองข้อมูล", icon: Database },
            { href: "/admin/admins", label: "จัดการ Admin", icon: UserCog },
            { href: "/admin/audit-logs", label: "Audit Logs", icon: Shield },
            { href: "/admin/settings", label: "ตั้งค่าระบบ", icon: Settings },
        ],
    },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { isLoading, isAuthenticated, admin, logout } = useAdminAuth();

    // ถ้าเป็นหน้า login ไม่ต้องแสดง layout และไม่ต้องตรวจสิทธิ์
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    // กำลังโหลด
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            </div>
        );
    }

    // ไม่มีสิทธิ์
    if (!isAuthenticated) {
        return null; // จะถูก redirect โดย useAdminAuth
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gray-900 z-50 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 text-white hover:bg-gray-800 rounded-lg"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Shield className="w-6 h-6 text-yellow-500" />
                        <span className="font-bold text-white">Admin Panel</span>
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
                    "fixed top-0 left-0 h-full w-64 bg-gray-900 z-50 transform transition-transform duration-200 flex flex-col",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Logo */}
                <div className="h-16 border-b border-gray-800 flex items-center justify-between px-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Shield className="w-8 h-8 text-yellow-500" />
                        <span className="font-bold text-lg text-white">Admin</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden p-1 text-white hover:bg-gray-800 rounded"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Nav Items - Scrollable */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-4">
                    {navGroups.map((group) => (
                        <div key={group.title}>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 mb-1">
                                {group.title}
                            </p>
                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const isActive = pathname.startsWith(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsSidebarOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
                                                isActive
                                                    ? "bg-yellow-500 text-gray-900 font-medium"
                                                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                            )}
                                        >
                                            <item.icon className="w-4 h-4" />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Bottom Section */}
                <div className="p-3 border-t border-gray-800 flex-shrink-0">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors text-sm"
                    >
                        <Sprout className="w-4 h-4" />
                        กลับหน้าหลัก
                    </Link>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        ออกจากระบบ
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
                {/* Top Bar */}
                <header className="hidden lg:flex h-14 bg-white border-b items-center justify-between px-6">
                    <div className="text-sm text-gray-500">
                        Smart Farm Admin Panel
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">
                            {admin?.name || admin?.username || 'Admin'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">
                            {admin?.role}
                        </span>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-6">{children}</div>
            </main>
        </div>
    );
}

