"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Download, Calendar, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface MonthlyTrend {
    month: string;
    income: number;
    expense: number;
}

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

export default function AdminReportsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<Stats | null>(null);
    const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
    const [selectedYear] = useState(new Date().getFullYear());

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('adminToken');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [statsRes, trendsRes] = await Promise.all([
                fetch(`${API_URL}/admin/stats`, { headers }),
                fetch(`${API_URL}/admin/dashboard/monthly-trends`, { headers }),
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (trendsRes.ok) setMonthlyTrends(await trendsRes.json());
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const exportReport = (type: 'csv' | 'json') => {
        const reportData = {
            generatedAt: new Date().toISOString(),
            year: selectedYear,
            stats,
            monthlyTrends,
        };

        if (type === 'json') {
            const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_${selectedYear}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } else {
            // CSV Export
            const csvLines = [
                'รายงานสรุป Smart Farm',
                `วันที่สร้าง: ${new Date().toLocaleDateString('th-TH')}`,
                '',
                'สถิติภาพรวม',
                `ผู้ใช้ทั้งหมด,${stats?.totalUsers || 0}`,
                `แปลงทั้งหมด,${stats?.totalPlots || 0}`,
                `กิจกรรมทั้งหมด,${stats?.totalActivities || 0}`,
                `รายรับรวม,${stats?.totalIncome || 0}`,
                `รายจ่ายรวม,${stats?.totalExpense || 0}`,
                `กำไร/ขาดทุน,${(stats?.totalIncome || 0) - (stats?.totalExpense || 0)}`,
                '',
                'รายเดือน',
                'เดือน,รายรับ,รายจ่าย,กำไร',
                ...monthlyTrends.map(t => `${t.month},${t.income},${t.expense},${t.income - t.expense}`),
            ];

            const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_${selectedYear}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            </div>
        );
    }

    const totalProfit = (stats?.totalIncome || 0) - (stats?.totalExpense || 0);
    const maxTrendValue = Math.max(...monthlyTrends.map(t => Math.max(t.income, t.expense)), 1);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">รายงาน</h1>
                    <p className="text-gray-500">สรุปข้อมูลและส่งออกรายงาน</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => exportReport('csv')}>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button variant="outline" onClick={() => exportReport('json')}>
                        <Download className="w-4 h-4 mr-2" />
                        Export JSON
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-600 font-medium">รายรับรวม</p>
                                <p className="text-3xl font-bold text-green-700">{formatCurrency(stats?.totalIncome || 0)}</p>
                            </div>
                            <TrendingUp className="w-12 h-12 text-green-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-600 font-medium">รายจ่ายรวม</p>
                                <p className="text-3xl font-bold text-red-700">{formatCurrency(stats?.totalExpense || 0)}</p>
                            </div>
                            <TrendingDown className="w-12 h-12 text-red-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className={`border-${totalProfit >= 0 ? 'blue' : 'orange'}-200 bg-gradient-to-br from-${totalProfit >= 0 ? 'blue' : 'orange'}-50 to-${totalProfit >= 0 ? 'blue' : 'orange'}-100`}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm ${totalProfit >= 0 ? 'text-blue-600' : 'text-orange-600'} font-medium`}>
                                    {totalProfit >= 0 ? 'กำไรสุทธิ' : 'ขาดทุน'}
                                </p>
                                <p className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                                    {formatCurrency(Math.abs(totalProfit))}
                                </p>
                            </div>
                            <BarChart3 className={`w-12 h-12 ${totalProfit >= 0 ? 'text-blue-400' : 'text-orange-400'}`} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Activity Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-gray-800">{formatNumber(stats?.totalUsers || 0)}</p>
                        <p className="text-sm text-gray-500">ผู้ใช้ทั้งหมด</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-gray-800">{formatNumber(stats?.totalPlots || 0)}</p>
                        <p className="text-sm text-gray-500">แปลงทั้งหมด</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-gray-800">{formatNumber(stats?.totalActivities || 0)}</p>
                        <p className="text-sm text-gray-500">กิจกรรมทั้งหมด</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-gray-800">{formatNumber(stats?.totalProducts || 0)}</p>
                        <p className="text-sm text-gray-500">สินค้าทั้งหมด</p>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Trends Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        รายรับ-รายจ่าย รายเดือน
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">เดือน</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">รายรับ</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">รายจ่าย</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">กำไร/ขาดทุน</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">กราฟ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {monthlyTrends.map((trend) => {
                                const profit = trend.income - trend.expense;
                                return (
                                    <tr key={trend.month} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{trend.month}</td>
                                        <td className="px-4 py-3 text-right text-green-600">{formatCurrency(trend.income)}</td>
                                        <td className="px-4 py-3 text-right text-red-600">{formatCurrency(trend.expense)}</td>
                                        <td className={`px-4 py-3 text-right font-medium ${profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                            {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1 h-4 w-40">
                                                <div
                                                    className="bg-green-500 rounded-l"
                                                    style={{ width: `${(trend.income / maxTrendValue) * 50}%` }}
                                                ></div>
                                                <div
                                                    className="bg-red-500 rounded-r"
                                                    style={{ width: `${(trend.expense / maxTrendValue) * 50}%` }}
                                                ></div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-gray-100 font-bold">
                            <tr>
                                <td className="px-4 py-3">รวม</td>
                                <td className="px-4 py-3 text-right text-green-600">
                                    {formatCurrency(monthlyTrends.reduce((sum, t) => sum + t.income, 0))}
                                </td>
                                <td className="px-4 py-3 text-right text-red-600">
                                    {formatCurrency(monthlyTrends.reduce((sum, t) => sum + t.expense, 0))}
                                </td>
                                <td className={`px-4 py-3 text-right ${totalProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                    {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
