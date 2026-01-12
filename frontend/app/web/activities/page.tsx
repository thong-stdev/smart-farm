"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ClipboardList, Plus, Loader2, TrendingUp, TrendingDown, Sprout, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { formatCurrency, formatDate } from "@/lib/utils";

interface Activity {
    id: string;
    type: string;
    amount?: number;
    description?: string;
    date: string;
    plot?: { id: string; name: string };
    product?: { id: string; name: string };
    quantity?: number;
    unit?: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function ActivitiesPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);

    const [filter, setFilter] = useState<string>("");

    const fetchActivities = useCallback(async () => {
        try {
            const token = localStorage.getItem("accessToken");
            const params = new URLSearchParams();
            if (filter) params.append("type", filter);
            params.append("limit", "20");

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/activities?${params}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.ok) {
                const data = await res.json();
                setActivities(data.data);
                setPagination(data.pagination);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "INCOME":
                return <TrendingUp className="w-5 h-5 text-green-600" />;
            case "EXPENSE":
                return <TrendingDown className="w-5 h-5 text-red-600" />;
            case "PLANTING":
                return <Sprout className="w-5 h-5 text-farm-green-600" />;
            default:
                return <Wrench className="w-5 h-5 text-gray-600" />;
        }
    };

    const getTypeText = (type: string) => {
        switch (type) {
            case "INCOME":
                return "รายรับ";
            case "EXPENSE":
                return "รายจ่าย";
            case "PLANTING":
                return "การปลูก";
            case "GENERAL":
                return "ทั่วไป";
            default:
                return type;
        }
    };

    const getTypeBgColor = (type: string) => {
        switch (type) {
            case "INCOME":
                return "bg-green-100";
            case "EXPENSE":
                return "bg-red-100";
            case "PLANTING":
                return "bg-farm-green-100";
            default:
                return "bg-gray-100";
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">กิจกรรม</h1>
                    <p className="text-gray-500">บันทึกและติดตามกิจกรรมการเกษตร</p>
                </div>
                <Link href="/web/activities/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        บันทึกกิจกรรม
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                <Button
                    variant={filter === "" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("")}
                >
                    ทั้งหมด
                </Button>
                <Button
                    variant={filter === "INCOME" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("INCOME")}
                >
                    <TrendingUp className="w-4 h-4 mr-1" />
                    รายรับ
                </Button>
                <Button
                    variant={filter === "EXPENSE" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("EXPENSE")}
                >
                    <TrendingDown className="w-4 h-4 mr-1" />
                    รายจ่าย
                </Button>
                <Button
                    variant={filter === "PLANTING" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("PLANTING")}
                >
                    <Sprout className="w-4 h-4 mr-1" />
                    การปลูก
                </Button>
            </div>

            {/* Activities List */}
            {activities.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีกิจกรรม</h3>
                        <p className="text-gray-500 mb-4">เริ่มบันทึกกิจกรรมแรกของคุณ</p>
                        <Link href="/web/activities/new">
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                บันทึกกิจกรรม
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {activities.map((activity) => (
                                <Link
                                    key={activity.id}
                                    href={`/web/activities/${activity.id}`}
                                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition"
                                >
                                    <div className={`w-10 h-10 rounded-xl ${getTypeBgColor(activity.type)} flex items-center justify-center`}>
                                        {getTypeIcon(activity.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">{getTypeText(activity.type)}</span>
                                            {activity.plot && (
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                                    {activity.plot.name}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">
                                            {activity.description || (activity.product?.name ? `${activity.product.name} ${activity.quantity || ""} ${activity.unit || ""}` : "-")}
                                        </p>
                                        <p className="text-xs text-gray-400">{formatDate(activity.date)}</p>
                                    </div>
                                    {activity.amount && (
                                        <div className={`text-right font-semibold ${activity.type === "INCOME" ? "text-green-600" : activity.type === "EXPENSE" ? "text-red-600" : "text-gray-600"}`}>
                                            {activity.type === "INCOME" ? "+" : activity.type === "EXPENSE" ? "-" : ""}
                                            {formatCurrency(activity.amount)}
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <span className="text-sm text-gray-500">
                        แสดง {activities.length} จาก {pagination.total} รายการ
                    </span>
                </div>
            )}
        </div>
    );
}
