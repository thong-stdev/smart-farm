"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Sprout,
    MapPin,
    ClipboardList,
    TrendingUp,
    TrendingDown,
    Plus,
    ArrowRight,
    Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface Stats {
    income: { total: number; count: number };
    expense: { total: number; count: number };
    planting: { count: number };
    profit: number;
}

interface Plot {
    id: string;
    name: string;
    size: number;
    status: string;
    _count: { cropCycles: number; activities: number };
}

export default function DashboardPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<Stats | null>(null);
    const [plots, setPlots] = useState<Plot[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) return;

            const headers = {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            };

            // Fetch stats and plots in parallel
            const [statsRes, plotsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/activities/summary`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/plots`, { headers }),
            ]);

            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data);
            }

            if (plotsRes.ok) {
                const data = await plotsRes.json();
                setPlots(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-farm-green-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
                    <p className="text-gray-500">ภาพรวมแปลงเกษตรของคุณ</p>
                </div>
                <Link href="/web/activities/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        บันทึกกิจกรรม
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">รายรับทั้งหมด</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatCurrency(stats?.income.total || 0)}
                                </p>
                                <p className="text-xs text-gray-400">{stats?.income.count || 0} รายการ</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">รายจ่ายทั้งหมด</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {formatCurrency(stats?.expense.total || 0)}
                                </p>
                                <p className="text-xs text-gray-400">{stats?.expense.count || 0} รายการ</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                <TrendingDown className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">กำไรสุทธิ</p>
                                <p className={`text-2xl font-bold ${(stats?.profit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                                    {formatCurrency(stats?.profit || 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-farm-green-100 flex items-center justify-center">
                                <Sprout className="w-6 h-6 text-farm-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">แปลงเกษตร</p>
                                <p className="text-2xl font-bold text-blue-600">{plots.length}</p>
                                <p className="text-xs text-gray-400">แปลง</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Plots Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>แปลงเกษตรของคุณ</CardTitle>
                    <Link href="/web/plots" className="text-sm text-farm-green-600 hover:underline flex items-center gap-1">
                        ดูทั้งหมด <ArrowRight className="w-4 h-4" />
                    </Link>
                </CardHeader>
                <CardContent>
                    {plots.length === 0 ? (
                        <div className="text-center py-8">
                            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 mb-4">ยังไม่มีแปลงเกษตร</p>
                            <Link href="/web/plots/new">
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    สร้างแปลงแรกของคุณ
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {plots.slice(0, 6).map((plot) => (
                                <Link
                                    key={plot.id}
                                    href={`/web/plots/${plot.id}`}
                                    className="p-4 border rounded-xl hover:border-farm-green-300 hover:shadow-sm transition"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-farm-green-100 flex items-center justify-center flex-shrink-0">
                                            <Sprout className="w-5 h-5 text-farm-green-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-900 truncate">{plot.name}</h3>
                                            <p className="text-sm text-gray-500">{plot.size} ไร่</p>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                                <span>{plot._count.cropCycles} รอบปลูก</span>
                                                <span>{plot._count.activities} กิจกรรม</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>ทางลัด</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Link
                            href="/web/activities/new"
                            className="p-4 border rounded-xl hover:border-farm-green-300 hover:bg-farm-green-50 transition text-center"
                        >
                            <ClipboardList className="w-8 h-8 text-farm-green-600 mx-auto mb-2" />
                            <span className="text-sm font-medium">บันทึกกิจกรรม</span>
                        </Link>
                        <Link
                            href="/web/plots/new"
                            className="p-4 border rounded-xl hover:border-farm-green-300 hover:bg-farm-green-50 transition text-center"
                        >
                            <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <span className="text-sm font-medium">สร้างแปลง</span>
                        </Link>
                        <Link
                            href="/web/reports"
                            className="p-4 border rounded-xl hover:border-farm-green-300 hover:bg-farm-green-50 transition text-center"
                        >
                            <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                            <span className="text-sm font-medium">ดูรายงาน</span>
                        </Link>
                        <Link
                            href="/web/ai"
                            className="p-4 border rounded-xl hover:border-farm-green-300 hover:bg-farm-green-50 transition text-center"
                        >
                            <Sprout className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                            <span className="text-sm font-medium">AI ผู้ช่วย</span>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
