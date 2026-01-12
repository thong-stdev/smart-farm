"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, Sprout, Loader2, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/services/api";
import { formatCurrency } from "@/lib/utils";

interface ReportData {
    income: { total: number; count: number };
    expense: { total: number; count: number };
    profit: number;
    plotBreakdown?: {
        plotId: string;
        plotName: string;
        income: number;
        expense: number;
        profit: number;
        plantingCount: number;
    }[];
}

export default function ReportsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [report, setReport] = useState<ReportData | null>(null);
    const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

    const fetchReport = useCallback(async () => {
        try {
            setIsLoading(true);
            const now = new Date();
            let startDate: Date;

            switch (period) {
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
            }

            const params = new URLSearchParams({
                startDate: startDate.toISOString(),
                endDate: now.toISOString(),
            });

            // Parallel fetch
            const [summaryRes, plotsRes] = await Promise.all([
                api.get<ReportData>(`/activities/summary?${params}`),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                api.get<any[]>(`/activities/summary/plots?${params}`)
            ]);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setReport({
                ...summaryRes,
                plotBreakdown: plotsRes
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-farm-green-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">รายงาน</h1>
                    <p className="text-gray-500">วิเคราะห์ต้นทุนและผลกำไร</p>
                </div>
                <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    ดาวน์โหลดรายงาน
                </Button>
            </div>

            {/* Period Selector */}
            <div className="flex gap-2">
                {[
                    { value: 'week', label: 'สัปดาห์นี้' },
                    { value: 'month', label: 'เดือนนี้' },
                    { value: 'year', label: 'ปีนี้' },
                ].map((p) => (
                    <Button
                        key={p.value}
                        variant={period === p.value ? 'default' : 'outline'}
                        size="sm"
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onClick={() => setPeriod(p.value as any)}
                    >
                        {p.label}
                    </Button>
                ))}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">รายรับ</p>
                                <p className="text-3xl font-bold text-green-600">
                                    {formatCurrency(report?.income.total || 0)}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {report?.income.count || 0} รายการ
                                </p>
                            </div>
                            <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
                                <TrendingUp className="w-7 h-7 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">รายจ่าย</p>
                                <p className="text-3xl font-bold text-red-600">
                                    {formatCurrency(report?.expense.total || 0)}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {report?.expense.count || 0} รายการ
                                </p>
                            </div>
                            <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center">
                                <TrendingDown className="w-7 h-7 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">กำไรสุทธิ</p>
                                <p className={`text-3xl font-bold ${(report?.profit || 0) >= 0 ? 'text-farm-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(report?.profit || 0)}
                                </p>
                            </div>
                            <div className="w-14 h-14 rounded-xl bg-farm-green-100 flex items-center justify-center">
                                <Sprout className="w-7 h-7 text-farm-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Plot Breakdown (New) */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <Sprout className="w-5 h-5 text-farm-green-600" />
                    สรุปรายแปลง
                </h2>

                {report?.plotBreakdown && report.plotBreakdown.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {report.plotBreakdown.map((plot: any) => (
                            <Card key={plot.plotId} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">{plot.plotName}</CardTitle>
                                        <Badge variant={plot.profit >= 0 ? "outline" : "destructive"}>
                                            {formatCurrency(plot.profit)}
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        กิจกรรมการปลูก: {plot.plantingCount} ครั้ง
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between text-green-600">
                                            <span>รายรับ</span>
                                            <span className="font-semibold">{formatCurrency(plot.income)}</span>
                                        </div>
                                        <div className="flex justify-between text-red-600">
                                            <span>รายจ่าย</span>
                                            <span className="font-semibold">{formatCurrency(plot.expense)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="bg-gray-50 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-8 text-gray-500">
                            <Sprout className="w-10 h-10 mb-2 opacity-20" />
                            <p>ไม่มีข้อมูลรายแปลงในช่วงเวลานี้</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Chart Placeholder */}
            {/* <Card> ... </Card> */}
        </div>
    );
}
