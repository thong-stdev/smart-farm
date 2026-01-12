"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
    ArrowLeft, MapPin, Sprout, Activity, DollarSign, Edit,
    Trash2, Loader2, ChevronRight, Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNumber, formatRelativeTime } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Dynamic import for map component
const PlotMap = dynamic(() => import("@/components/plots/PlotMap"), { ssr: false });
const AddCropCycleModal = dynamic(() => import("@/components/plots/AddCropCycleModal"), { ssr: false });
const AddActivityModal = dynamic(() => import("@/components/plots/AddActivityModal"), { ssr: false });

interface PlotDetail {
    id: string;
    name: string;
    size: number;
    status: string;
    lat?: number;
    lng?: number;
    address?: string;
    image?: string;
    polygon?: { lat: number; lng: number }[];
    soilType?: string;
    waterSource?: string;
    irrigation?: string;
    sunExposure?: string;
    elevation?: number;
    slope?: number;
    createdAt: string;
    cropCycles: {
        id: string;
        cropType: string;
        status: string;
        startDate: string;
        endDate?: string;
        cropVariety?: { name: string }; // [FIX] Match Backend
    }[];
    activities: {
        id: string;
        type: string;
        description?: string;
        amount?: number;
        date: string;
    }[];
    summary?: {
        totalIncome: number;
        totalExpense: number;
        profit: number;
        totalActivities: number;
    };
}

export default function PlotDetailPage() {
    const params = useParams();
    const router = useRouter();
    const plotId = params.id as string;

    const [plot, setPlot] = useState<PlotDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    // Modals
    const [showAddCycle, setShowAddCycle] = useState(false);
    const [showAddActivity, setShowAddActivity] = useState(false);
    const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);

    const fetchPlot = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${API_URL}/plots/${plotId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setPlot(await res.json());
            }
        } catch (err) {
            console.error("Failed to fetch plot:", err);
        } finally {
            setIsLoading(false);
        }
    }, [plotId]);

    useEffect(() => {
        fetchPlot();
    }, [fetchPlot]);

    const handleDelete = async () => {
        if (!confirm("ต้องการลบแปลงนี้? ข้อมูลทั้งหมดจะถูกลบด้วย")) return;

        try {
            setIsDeleting(true);
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${API_URL}/plots/${plotId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                router.push("/web/plots");
            }
        } catch (err) {
            console.error("Failed to delete:", err);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCycle = async (cycleId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("ต้องการลบรอบการปลูกนี้? กิจกรรมทั้งหมดจะถูกลบด้วย")) return;

        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${API_URL}/crop-cycles/${cycleId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                fetchPlot();
            }
        } catch (err) {
            console.error("Failed to delete cycle:", err);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ACTIVE": return "bg-green-100 text-green-700";
            case "COMPLETED": return "bg-blue-100 text-blue-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "INCOME": return "text-green-600";
            case "EXPENSE": return "text-red-600";
            default: return "text-gray-600";
        }
    };

    const soilTypeLabels: Record<string, string> = {
        CLAY: "ดินเหนียว",
        LOAM: "ดินร่วน",
        SAND: "ดินทราย",
        SILT: "ดินตะกอน",
        PEAT: "ดินพรุ",
    };

    const waterSourceLabels: Record<string, string> = {
        WELL: "บ่อบาดาล",
        RIVER: "แม่น้ำ/ลำคลอง",
        RAIN: "น้ำฝน",
        POND: "บ่อเก็บน้ำ",
        TAP: "ประปา",
    };

    const irrigationLabels: Record<string, string> = {
        DRIP: "น้ำหยด",
        SPRINKLER: "สปริงเกอร์",
        FLOOD: "ท่วมขัง",
        FURROW: "ร่อง",
        MANUAL: "รดด้วยมือ",
    };

    const sunExposureLabels: Record<string, string> = {
        FULL: "แดดจัด",
        PARTIAL: "ร่มรำไร",
        SHADE: "ร่มเงา",
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-farm-green-600" />
            </div>
        );
    }

    if (!plot) {
        return (
            <div className="p-4 text-center">
                <p className="text-gray-500">ไม่พบข้อมูลแปลง</p>
                <Link href="/web/plots">
                    <Button variant="outline" className="mt-4">กลับหน้าแปลง</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/web/plots" className="p-2 hover:bg-gray-100 rounded-lg">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <div className="flex items-baseline gap-2">
                                <h1 className="text-xl font-bold">{plot.name}</h1>
                                <Link href="/web/plots" className="text-xs text-farm-green-600 hover:underline">
                                    กลับหน้าแปลงเกษตร
                                </Link>
                            </div>
                            <p className="text-sm text-gray-500">{plot.size.toFixed(2)} ไร่</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/web/plots/${plotId}/edit`}>
                            <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4 mr-1" /> แก้ไข
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-700"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 space-y-4">
                {/* Map */}
                {plot.lat && plot.lng && (
                    <Card>
                        <CardContent className="p-0 h-48 overflow-hidden rounded-lg">
                            <PlotMap
                                lat={plot.lat}
                                lng={plot.lng}
                                polygon={plot.polygon}
                                readOnly
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card>
                        <CardContent className="p-3 text-center">
                            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-green-100 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <p className="text-lg font-bold text-green-600">
                                ฿{formatNumber(plot.summary?.totalIncome || 0)}
                            </p>
                            <p className="text-xs text-gray-500">รายรับ</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-3 text-center">
                            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-red-100 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-red-600" />
                            </div>
                            <p className="text-lg font-bold text-red-600">
                                ฿{formatNumber(plot.summary?.totalExpense || 0)}
                            </p>
                            <p className="text-xs text-gray-500">รายจ่าย</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-3 text-center">
                            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-100 flex items-center justify-center">
                                <Sprout className="w-5 h-5 text-blue-600" />
                            </div>
                            <p className="text-lg font-bold">{plot.cropCycles?.length || 0}</p>
                            <p className="text-xs text-gray-500">รอบปลูก</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-3 text-center">
                            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-purple-100 flex items-center justify-center">
                                <Activity className="w-5 h-5 text-purple-600" />
                            </div>
                            <p className="text-lg font-bold">{plot.summary?.totalActivities || 0}</p>
                            <p className="text-xs text-gray-500">กิจกรรม</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Plot Info */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">ข้อมูลแปลง</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {plot.address && (
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                <span className="text-sm text-gray-600">{plot.address}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            {plot.soilType && (
                                <div>
                                    <p className="text-xs text-gray-400">ประเภทดิน</p>
                                    <p className="font-medium">{soilTypeLabels[plot.soilType] || plot.soilType}</p>
                                </div>
                            )}
                            {plot.waterSource && (
                                <div>
                                    <p className="text-xs text-gray-400">แหล่งน้ำ</p>
                                    <p className="font-medium">{waterSourceLabels[plot.waterSource] || plot.waterSource}</p>
                                </div>
                            )}
                            {plot.irrigation && (
                                <div>
                                    <p className="text-xs text-gray-400">ระบบชลประทาน</p>
                                    <p className="font-medium">{irrigationLabels[plot.irrigation] || plot.irrigation}</p>
                                </div>
                            )}
                            {plot.sunExposure && (
                                <div>
                                    <p className="text-xs text-gray-400">แสงแดด</p>
                                    <p className="font-medium">{sunExposureLabels[plot.sunExposure] || plot.sunExposure}</p>
                                </div>
                            )}
                            {plot.elevation && (
                                <div>
                                    <p className="text-xs text-gray-400">ความสูง</p>
                                    <p className="font-medium">{plot.elevation} เมตร</p>
                                </div>
                            )}
                            {plot.slope && (
                                <div>
                                    <p className="text-xs text-gray-400">ความลาด</p>
                                    <p className="font-medium">{plot.slope}%</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Crop Cycles */}
                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-base">รอบการปลูก</CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAddCycle(true)}
                        >
                            <Plus className="w-4 h-4 mr-1" /> เพิ่มรอบ
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {plot.cropCycles && plot.cropCycles.length > 0 ? (
                            <div className="space-y-2">
                                {plot.cropCycles.slice(0, 5).map((cycle) => (
                                    <div
                                        key={cycle.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors"
                                    >
                                        <Link href={`/web/crop-cycles/${cycle.id}`} className="flex items-center gap-3 flex-1">
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {cycle.cropVariety?.name || cycle.cropType || "ยังไม่ระบุพืช"}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    เริ่ม {formatRelativeTime(cycle.startDate)}
                                                </p>
                                            </div>
                                        </Link>

                                        <div className="flex items-center gap-2">
                                            {cycle.status === "ACTIVE" && (
                                                <Link
                                                    href={`/web/activities/new?plotId=${plotId}&cropCycleId=${cycle.id}`}
                                                    className="h-8 text-xs hidden group-hover:flex items-center justify-center px-3 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md shadow-sm"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Plus className="w-3 h-3 mr-1" /> กิจกรรม
                                                </Link>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-red-500 hidden group-hover:flex hover:bg-red-50"
                                                onClick={(e) => handleDeleteCycle(cycle.id, e)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(cycle.status)}`}>
                                                {cycle.status === "ACTIVE" ? "กำลังปลูก" : "เก็บเกี่ยวแล้ว"}
                                            </span>
                                            <Link href={`/web/crop-cycles/${cycle.id}`}>
                                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Sprout className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>ยังไม่มีรอบการปลูก</p>
                                <Button
                                    variant="link"
                                    className="text-farm-green-600 mt-2"
                                    onClick={() => setShowAddCycle(true)}
                                >
                                    เริ่มปลูกรอบแรก
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activities */}
                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-base">กิจกรรมล่าสุด</CardTitle>
                        <Link href={`/web/activities?plotId=${plotId}`}>
                            <Button variant="ghost" size="sm">ดูทั้งหมด</Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {plot.activities && plot.activities.length > 0 ? (
                            <div className="space-y-2">
                                {plot.activities.slice(0, 5).map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div>
                                            <p className="font-medium">{activity.description || activity.type}</p>
                                            <p className="text-xs text-gray-500">
                                                {formatRelativeTime(activity.date)}
                                            </p>
                                        </div>
                                        {activity.amount && (
                                            <span className={`font-medium ${getTypeColor(activity.type)}`}>
                                                {activity.type === "INCOME" ? "+" : "-"}฿{formatNumber(activity.amount)}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>ยังไม่มีกิจกรรม</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modals */}
            <AddCropCycleModal
                isOpen={showAddCycle}
                onClose={() => setShowAddCycle(false)}
                onSuccess={fetchPlot}
                plotId={plotId}
            />

            {selectedCycleId && (
                <AddActivityModal
                    isOpen={showAddActivity}
                    onClose={() => {
                        setShowAddActivity(false);
                        setSelectedCycleId(null);
                    }}
                    onSuccess={fetchPlot}
                    plotId={plotId}
                    cropCycleId={selectedCycleId}
                />
            )}
        </div>
    );
}
