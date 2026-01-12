"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, Sprout, TrendingUp, TrendingDown, Wrench, Plus,
    Calendar, Loader2, Edit2, CheckCircle, AlertCircle, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface CropCycleDetail {
    id: string;
    plotId: string;
    cropType?: string;
    status: string;
    startDate: string;
    endDate?: string;
    plantedAt?: string;
    yield?: number;
    note?: string;
    hasPlanting: boolean;
    plantingActivity?: { id: string; date: string; description?: string };
    plot: { id: string; name: string };
    cropVariety?: { id: string; name: string; duration?: number; cropType?: { name: string } };
    plan?: { id: string; name: string; stages: PlanStage[] };
    activities: Activity[];
    financeSummary?: {
        totalExpense: number;
        totalIncome: number;
        profit: number;
        activityCount: number;
    };
    _count: { activities: number };
}

interface PlanStage {
    id: string;
    name: string;
    dayStart: number;
    dayEnd: number;
    description?: string;
}

interface Activity {
    id: string;
    type: string;
    amount?: number;
    description?: string;
    date: string;
    images?: { id: string; imageUrl: string }[];
}

export default function CropCycleDetailPage() {
    const params = useParams();

    const cycleId = params.id as string;

    const [cycle, setCycle] = useState<CropCycleDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEnding, setIsEnding] = useState(false);


    const fetchCycle = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${API_URL}/crop-cycles/${cycleId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setCycle(await res.json());
            }
        } catch (err) {
            console.error("Failed to fetch cycle:", err);
        } finally {
            setIsLoading(false);
        }
    }, [cycleId]);

    useEffect(() => {
        fetchCycle();
    }, [fetchCycle]);

    const handleEndCycle = async () => {
        if (!confirm("ต้องการจบรอบการปลูกนี้หรือไม่? หลังจบรอบจะไม่สามารถเพิ่มกิจกรรมได้")) return;

        try {
            setIsEnding(true);
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${API_URL}/crop-cycles/${cycleId}/complete`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({}),
            });

            if (res.ok) {
                fetchCycle();
            }
        } catch (err) {
            console.error("Failed to complete cycle:", err);
        } finally {
            setIsEnding(false);
        }
    };



    const getActivityTypeLabel = (type: string) => {
        switch (type) {
            case "INCOME": return "รายรับ";
            case "EXPENSE": return "รายจ่าย";
            case "PLANTING": return "การปลูก";
            default: return type;
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "INCOME": return <TrendingUp className="w-4 h-4 text-green-600" />;
            case "EXPENSE": return <TrendingDown className="w-4 h-4 text-red-600" />;
            case "PLANTING": return <Sprout className="w-4 h-4 text-farm-green-600" />;
            default: return <Wrench className="w-4 h-4 text-gray-600" />;
        }
    };

    const getActivityBg = (type: string) => {
        switch (type) {
            case "INCOME": return "bg-green-100";
            case "EXPENSE": return "bg-red-100";
            case "PLANTING": return "bg-farm-green-100";
            default: return "bg-gray-100";
        }
    };

    const getDaysSinceStart = () => {
        if (!cycle) return 0;
        const start = new Date(cycle.startDate);
        const now = new Date();
        return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-farm-green-600" />
            </div>
        );
    }

    if (!cycle) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">ไม่พบข้อมูลรอบการปลูก</p>
                <Link href="/web/plots">
                    <Button variant="outline" className="mt-4">กลับหน้าแปลง</Button>
                </Link>
            </div>
        );
    }

    const isCompleted = cycle.status === "COMPLETED";
    const daysSinceStart = getDaysSinceStart();

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/web/plots/${cycle.plotId}`} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">
                            {cycle.cropVariety?.name || cycle.cropType || "ยังไม่ระบุพืช"}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {cycle.plot.name} • เริ่ม {formatRelativeTime(cycle.startDate)}
                            {cycle.plantedAt && ` • ปลูกเมื่อ ${formatDate(cycle.plantedAt)}`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${isCompleted ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-700"
                        }`}>
                        {isCompleted ? "เสร็จสิ้น" : cycle.plantedAt ? "กำลังเติบโต" : "รอการปลูก"}
                    </span>
                    {!isCompleted && (
                        <span className="text-sm text-gray-500">วันที่ {daysSinceStart}</span>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">รายรับ</p>
                        <p className="text-lg font-bold text-green-600">
                            {formatCurrency(cycle.financeSummary?.totalIncome || 0)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <TrendingDown className="w-6 h-6 text-red-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">รายจ่าย</p>
                        <p className="text-lg font-bold text-red-600">
                            {formatCurrency(cycle.financeSummary?.totalExpense || 0)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <AlertCircle className={`w-6 h-6 mx-auto mb-2 ${(cycle.financeSummary?.profit || 0) >= 0 ? "text-green-600" : "text-red-600"
                            }`} />
                        <p className="text-sm text-gray-500">กำไร/ขาดทุน</p>
                        <p className={`text-lg font-bold ${(cycle.financeSummary?.profit || 0) >= 0 ? "text-green-600" : "text-red-600"
                            }`}>
                            {formatCurrency(cycle.financeSummary?.profit || 0)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Plan Timeline (if has plan) */}
            {cycle.plan && cycle.plan.stages.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            แผนการปลูก: {cycle.plan.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {cycle.plan.stages.map((stage, index) => {
                                const isCurrentStage = daysSinceStart >= stage.dayStart && daysSinceStart <= stage.dayEnd;
                                const isPastStage = daysSinceStart > stage.dayEnd;

                                return (
                                    <div key={stage.id} className="flex items-start gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isPastStage ? "bg-green-100 text-green-600" :
                                            isCurrentStage ? "bg-farm-green-500 text-white" :
                                                "bg-gray-100 text-gray-400"
                                            }`}>
                                            {isPastStage ? <CheckCircle className="w-4 h-4" /> :
                                                isCurrentStage ? <Clock className="w-4 h-4" /> :
                                                    <span className="text-xs">{index + 1}</span>}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`font-medium ${isCurrentStage ? "text-farm-green-600" : ""}`}>
                                                {stage.name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                วันที่ {stage.dayStart} - {stage.dayEnd}
                                                {stage.description && ` • ${stage.description}`}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Activities */}
            <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-base">
                        กิจกรรม ({cycle._count.activities})
                    </CardTitle>
                    {!isCompleted && (
                        <Link href={`/web/activities/new?plotId=${cycle.plotId}&cropCycleId=${cycleId}`}>
                            <Button size="sm">
                                <Plus className="w-4 h-4 mr-1" /> เพิ่มกิจกรรม
                            </Button>
                        </Link>
                    )}
                </CardHeader>
                <CardContent>
                    {cycle.activities.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Wrench className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>ยังไม่มีกิจกรรม</p>
                            {!isCompleted && (
                                <Link href={`/web/activities/new?plotId=${cycle.plotId}&cropCycleId=${cycleId}`}>
                                    <Button variant="link" className="text-farm-green-600 mt-2">
                                        เพิ่มกิจกรรมแรก
                                    </Button>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {cycle.activities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full ${getActivityBg(activity.type)} flex items-center justify-center`}>
                                            {getActivityIcon(activity.type)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {activity.description || getActivityTypeLabel(activity.type)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatDate(activity.date)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {activity.amount && (
                                            <span className={`font-medium ${activity.type === "INCOME" ? "text-green-600" :
                                                activity.type === "EXPENSE" ? "text-red-600" :
                                                    "text-gray-600"
                                                }`}>
                                                {activity.type === "INCOME" ? "+" : activity.type === "EXPENSE" ? "-" : ""}
                                                {formatCurrency(activity.amount)}
                                            </span>
                                        )}
                                        {!isCompleted && (
                                            <Link href={`/web/activities/${activity.id}/edit?cropCycleId=${cycleId}`}>
                                                <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100">
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
                {!isCompleted && (
                    <Button
                        onClick={handleEndCycle}
                        disabled={isEnding}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                        {isEnding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                        จบรอบการปลูก
                    </Button>
                )}
            </div>
        </div>
    );
}
