"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Sprout, ClipboardList, TrendingUp, TrendingDown, Loader2, Package, UserPlus, Map, PieChart, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatRelativeTime, formatNumber } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Stats {
    totalUsers: number;
    totalPlots: number;
    totalActivities: number;
    todayActivities: number;
    totalProducts: number;
    totalCropTypes: number;
    totalIncome: number;
    totalExpense: number;
}

interface RecentActivity {
    id: string;
    type: 'INCOME' | 'EXPENSE' | 'PLANTING' | 'GENERAL';
    amount: number | null;
    description: string | null;
    createdAt: string;
    user: { id: string; displayName: string | null };
    plot: { id: string; name: string } | null;
}

interface MonthlyTrend {
    month: string;
    income: number;
    expense: number;
}

interface CropStat {
    name: string;
    count: number;
}

interface PlotStat {
    status: string;
    count: number;
}

interface ActivityTypeStat {
    type: string;
    count: number;
}

export default function AdminDashboardPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
    const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
    const [newUsersToday, setNewUsersToday] = useState(0);
    const [activePlots, setActivePlots] = useState(0);
    const [cropStats, setCropStats] = useState<CropStat[]>([]);
    const [plotStats, setPlotStats] = useState<PlotStat[]>([]);
    const [activityTypeStats, setActivityTypeStats] = useState<ActivityTypeStat[]>([]);

    const fetchDashboardData = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('adminToken');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [statsRes, activitiesRes, trendsRes, newUsersRes, activePlotsRes, cropStatsRes, plotStatsRes, activityTypeRes] = await Promise.all([
                fetch(`${API_URL}/admin/stats`, { headers }),
                fetch(`${API_URL}/admin/recent-activities?limit=5`, { headers }),
                fetch(`${API_URL}/admin/dashboard/monthly-trends`, { headers }),
                fetch(`${API_URL}/admin/dashboard/new-users-today`, { headers }),
                fetch(`${API_URL}/admin/dashboard/active-plots`, { headers }),
                fetch(`${API_URL}/admin/dashboard/crop-stats`, { headers }),
                fetch(`${API_URL}/admin/dashboard/plot-stats`, { headers }),
                fetch(`${API_URL}/admin/dashboard/activity-by-type`, { headers }),
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (activitiesRes.ok) setRecentActivities(await activitiesRes.json());
            if (trendsRes.ok) setMonthlyTrends(await trendsRes.json());
            if (newUsersRes.ok) {
                const data = await newUsersRes.json();
                setNewUsersToday(data.count);
            }
            if (activePlotsRes.ok) {
                const data = await activePlotsRes.json();
                setActivePlots(data.count);
            }
            if (cropStatsRes.ok) setCropStats(await cropStatsRes.json());
            if (plotStatsRes.ok) setPlotStats(await plotStatsRes.json());
            if (activityTypeRes.ok) setActivityTypeStats(await activityTypeRes.json());
        } catch (err) {
            console.error('Failed to fetch dashboard:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const getActivityTypeColor = (type: string) => {
        switch (type) {
            case 'INCOME': return 'text-green-600 bg-green-50';
            case 'EXPENSE': return 'text-red-600 bg-red-50';
            case 'PLANTING': return 'text-blue-600 bg-blue-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getActivityTypeLabel = (type: string) => {
        switch (type) {
            case 'INCOME': return 'รายรับ';
            case 'EXPENSE': return 'รายจ่าย';
            case 'PLANTING': return 'การปลูก';
            default: return 'ทั่วไป';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'ใช้งาน';
            case 'NORMAL': return 'ปกติ';
            case 'FALLOW': return 'พักดิน';
            case 'PROBLEM': return 'มีปัญหา';
            default: return status;
        }
    };

    const chartColors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            </div>
        );
    }

    const maxTrendValue = Math.max(...monthlyTrends.map(t => Math.max(t.income, t.expense)), 1);
    const maxCropCount = Math.max(...cropStats.map(c => c.count), 1);
    const totalActivityCount = activityTypeStats.reduce((sum, a) => sum + a.count, 0);

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500">ภาพรวมระบบ Smart Farm</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                                <p className="text-sm text-gray-500">ผู้ใช้ทั้งหมด</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <Sprout className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.totalPlots || 0}</p>
                                <p className="text-sm text-gray-500">แปลงทั้งหมด</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                <ClipboardList className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.totalActivities || 0}</p>
                                <p className="text-sm text-gray-500">กิจกรรม</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                                <Package className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.totalProducts || 0}</p>
                                <p className="text-sm text-gray-500">สินค้า</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* New Stats */}
                <Card className="border-green-200 bg-green-50/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-200 flex items-center justify-center">
                                <UserPlus className="w-5 h-5 text-green-700" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-700">{newUsersToday}</p>
                                <p className="text-sm text-green-600">ผู้ใช้ใหม่วันนี้</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-200 flex items-center justify-center">
                                <Map className="w-5 h-5 text-blue-700" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-blue-700">{activePlots}</p>
                                <p className="text-sm text-blue-600">แปลงที่ใช้งาน</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-emerald-600">{formatCurrency(stats?.totalIncome || 0)}</p>
                                <p className="text-sm text-gray-500">รายรับรวม</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                                <TrendingDown className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-red-600">{formatCurrency(stats?.totalExpense || 0)}</p>
                                <p className="text-sm text-gray-500">รายจ่ายรวม</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Crop Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <BarChart3 className="w-4 h-4" />
                            พืชยอดนิยม
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {cropStats.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">ไม่มีข้อมูล</p>
                        ) : (
                            <div className="space-y-3">
                                {cropStats.map((crop, i) => (
                                    <div key={crop.name} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-700">{crop.name}</span>
                                            <span className="text-gray-500">{crop.count} รอบ</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${(crop.count / maxCropCount) * 100}%`,
                                                    backgroundColor: chartColors[i % chartColors.length]
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Plot Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <PieChart className="w-4 h-4" />
                            สถานะแปลง
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {plotStats.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">ไม่มีข้อมูล</p>
                        ) : (
                            <div className="space-y-2">
                                {plotStats.map((plot, i) => (
                                    <div key={plot.status} className="flex items-center gap-3">
                                        <div
                                            className="w-4 h-4 rounded"
                                            style={{ backgroundColor: chartColors[i % chartColors.length] }}
                                        />
                                        <span className="text-sm text-gray-700 flex-1">{getStatusLabel(plot.status)}</span>
                                        <span className="text-sm font-medium">{plot.count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Activity Type Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ClipboardList className="w-4 h-4" />
                            กิจกรรมตามประเภท
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activityTypeStats.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">ไม่มีข้อมูล</p>
                        ) : (
                            <div className="space-y-2">
                                {activityTypeStats.map((act) => (
                                    <div key={act.type} className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded text-xs ${getActivityTypeColor(act.type)}`}>
                                            {getActivityTypeLabel(act.type)}
                                        </span>
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${act.type === 'INCOME' ? 'bg-green-500' : act.type === 'EXPENSE' ? 'bg-red-500' : 'bg-blue-500'}`}
                                                style={{ width: `${(act.count / totalActivityCount) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-gray-500 w-10 text-right">{act.count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Trends Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>รายรับ-รายจ่าย 6 เดือนล่าสุด</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-green-500"></div>
                                <span>รายรับ</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-red-500"></div>
                                <span>รายจ่าย</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {monthlyTrends.map((trend) => (
                                <div key={trend.month} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">{trend.month}</span>
                                        <span className="text-gray-500">
                                            +{formatNumber(trend.income)} / -{formatNumber(trend.expense)}
                                        </span>
                                    </div>
                                    <div className="flex gap-1 h-6">
                                        <div
                                            className="bg-green-500 rounded-l"
                                            style={{ width: `${(trend.income / maxTrendValue) * 50}%` }}
                                        ></div>
                                        <div
                                            className="bg-red-500 rounded-r"
                                            style={{ width: `${(trend.expense / maxTrendValue) * 50}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
                <CardHeader>
                    <CardTitle>กิจกรรมล่าสุด</CardTitle>
                </CardHeader>
                <CardContent>
                    {recentActivities.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">ไม่มีกิจกรรม</p>
                    ) : (
                        <div className="space-y-3">
                            {recentActivities.map((activity) => (
                                <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getActivityTypeColor(activity.type)}`}>
                                            {getActivityTypeLabel(activity.type)}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {activity.description || 'ไม่มีคำอธิบาย'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {activity.user?.displayName || 'ไม่ระบุ'} • {activity.plot?.name || 'ไม่ระบุแปลง'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {activity.amount && (
                                            <p className={`font-medium ${activity.type === 'INCOME' ? 'text-green-600' : activity.type === 'EXPENSE' ? 'text-red-600' : 'text-gray-600'}`}>
                                                {activity.type === 'INCOME' ? '+' : '-'}{formatCurrency(activity.amount)}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-400">{formatRelativeTime(activity.createdAt)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

