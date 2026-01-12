"use client";

import { useState, useEffect } from "react";
import {
    TrendingUp,
    Eye,
    MousePointer,
    Loader2,
    Calendar,
    Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";

interface ProductAnalytics {
    product: { id: string; name: string; imageUrl?: string };
    impressions: number;
    clicks?: number;
}

interface AnalyticsData {
    period: { startDate: string; endDate: string; days: number };
    topByImpressions: ProductAnalytics[];
    topByClicks: ProductAnalytics[];
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [days, setDays] = useState(30);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const token = localStorage.getItem("adminToken");
                if (!token) return;

                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
                const res = await fetch(`${apiUrl}/admin/analytics/products?days=${days}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [days]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-farm-green-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Product Analytics</h1>
                    <p className="text-gray-500">สถิติ Impressions และ Clicks ของสินค้า</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">ช่วงเวลา:</span>
                    <select
                        className="px-3 py-2 border rounded-lg"
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                    >
                        <option value={7}>7 วัน</option>
                        <option value={30}>30 วัน</option>
                        <option value={90}>90 วัน</option>
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Eye className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Impressions</p>
                                <p className="text-2xl font-bold">
                                    {data?.topByImpressions.reduce((sum, i) => sum + i.impressions, 0).toLocaleString() || 0}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <MousePointer className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Clicks</p>
                                <p className="text-2xl font-bold">
                                    {data?.topByClicks.reduce((sum, c) => sum + (c.clicks || 0), 0).toLocaleString() || 0}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Avg CTR</p>
                                <p className="text-2xl font-bold">
                                    {(() => {
                                        const totalImpr = data?.topByImpressions.reduce((sum, i) => sum + i.impressions, 0) || 0;
                                        const totalClicks = data?.topByClicks.reduce((sum, c) => sum + (c.clicks || 0), 0) || 0;
                                        return totalImpr > 0 ? ((totalClicks / totalImpr) * 100).toFixed(2) : "0.00";
                                    })()}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Products */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top by Impressions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="w-5 h-5 text-blue-600" />
                            Top 10 - Impressions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!data?.topByImpressions.length ? (
                            <p className="text-center py-8 text-gray-500">ยังไม่มีข้อมูล</p>
                        ) : (
                            <div className="space-y-3">
                                {data.topByImpressions.map((item, idx) => (
                                    <div key={item.product?.id || idx} className="flex items-center gap-3">
                                        <span className="w-6 text-center font-bold text-gray-400">#{idx + 1}</span>
                                        <Package className="w-5 h-5 text-gray-400" />
                                        <span className="flex-1 truncate">{item.product?.name || "Unknown"}</span>
                                        <span className="font-medium text-blue-600">
                                            {item.impressions.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top by Clicks */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MousePointer className="w-5 h-5 text-green-600" />
                            Top 10 - Clicks
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!data?.topByClicks.length ? (
                            <p className="text-center py-8 text-gray-500">ยังไม่มีข้อมูล</p>
                        ) : (
                            <div className="space-y-3">
                                {data.topByClicks.map((item, idx) => (
                                    <div key={item.product?.id || idx} className="flex items-center gap-3">
                                        <span className="w-6 text-center font-bold text-gray-400">#{idx + 1}</span>
                                        <Package className="w-5 h-5 text-gray-400" />
                                        <span className="flex-1 truncate">{item.product?.name || "Unknown"}</span>
                                        <span className="font-medium text-green-600">
                                            {(item.clicks || 0).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Period Info */}
            {data?.period && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>
                                ข้อมูลตั้งแต่ {new Date(data.period.startDate).toLocaleDateString("th-TH")} ถึง{" "}
                                {new Date(data.period.endDate).toLocaleDateString("th-TH")} ({data.period.days} วัน)
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
