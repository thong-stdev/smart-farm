"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Loader2, Save, MapPin, Ruler } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Dynamic imports for map components
const LocationPicker = dynamic(() => import("@/components/plots/LocationPicker"), { ssr: false });
const AreaMeasure = dynamic(() => import("@/components/plots/AreaMeasure"), { ssr: false });

interface PlotData {
    id: string;
    name: string;
    size: number;
    lat?: number;
    lng?: number;
    address?: string;
    polygon?: { lat: number; lng: number }[];
    soilType?: string;
    waterSource?: string;
    irrigation?: string;
    sunExposure?: string;
    elevation?: number;
    slope?: number;
}

const SOIL_TYPES = [
    { value: "", label: "-- เลือก --" },
    { value: "CLAY", label: "ดินเหนียว" },
    { value: "LOAM", label: "ดินร่วน" },
    { value: "SAND", label: "ดินทราย" },
    { value: "SILT", label: "ดินตะกอน" },
    { value: "PEAT", label: "ดินพรุ" },
];

const WATER_SOURCES = [
    { value: "", label: "-- เลือก --" },
    { value: "WELL", label: "บ่อบาดาล" },
    { value: "RIVER", label: "แม่น้ำ/ลำคลอง" },
    { value: "RAIN", label: "น้ำฝน" },
    { value: "POND", label: "บ่อเก็บน้ำ" },
    { value: "TAP", label: "ประปา" },
];

const IRRIGATION_TYPES = [
    { value: "", label: "-- เลือก --" },
    { value: "DRIP", label: "น้ำหยด" },
    { value: "SPRINKLER", label: "สปริงเกอร์" },
    { value: "FLOOD", label: "ท่วมขัง" },
    { value: "FURROW", label: "ร่อง" },
    { value: "MANUAL", label: "รดด้วยมือ" },
];

const SUN_EXPOSURES = [
    { value: "", label: "-- เลือก --" },
    { value: "FULL", label: "แดดจัด" },
    { value: "PARTIAL", label: "ร่มรำไร" },
    { value: "SHADE", label: "ร่มเงา" },
];

type EditMode = "form" | "location" | "area";

export default function EditPlotPage() {
    const params = useParams();
    const router = useRouter();
    const plotId = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [editMode, setEditMode] = useState<EditMode>("form");
    const [form, setForm] = useState<PlotData>({
        id: "",
        name: "",
        size: 0,
    });

    const fetchPlot = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${API_URL}/plots/${plotId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setForm(data);
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

    const handleChange = (field: keyof PlotData, value: string | number) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    // Handle location update from LocationPicker
    const handleLocationSelect = (lat: number, lng: number, address: string) => {
        setForm(prev => ({ ...prev, lat, lng, address }));
        setEditMode("form");
    };

    // Handle area update from AreaMeasure
    const handleAreaSelect = (polygon: { lat: number; lng: number }[], area: number) => {
        setForm(prev => ({ ...prev, polygon, size: area }));
        setEditMode("form");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name.trim()) {
            setError("กรุณากรอกชื่อแปลง");
            return;
        }

        try {
            setIsSaving(true);
            setError("");

            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${API_URL}/plots/${plotId}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: form.name,
                    size: Number(form.size) || 0,
                    lat: form.lat,
                    lng: form.lng,
                    address: form.address,
                    polygon: form.polygon,
                    soilType: form.soilType || null,
                    waterSource: form.waterSource || null,
                    irrigation: form.irrigation || null,
                    sunExposure: form.sunExposure || null,
                    elevation: form.elevation ? Number(form.elevation) : null,
                    slope: form.slope ? Number(form.slope) : null,
                }),
            });

            if (!res.ok) {
                throw new Error("บันทึกไม่สำเร็จ");
            }

            router.push(`/web/plots/${plotId}`);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-farm-green-600" />
            </div>
        );
    }

    // Location Edit Mode
    if (editMode === "location") {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="bg-white border-b px-4 py-3">
                    <div className="max-w-4xl mx-auto flex items-center gap-4">
                        <button onClick={() => setEditMode("form")} className="p-2 hover:bg-gray-100 rounded-lg">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-bold">เลือกตำแหน่งใหม่</h1>
                    </div>
                </div>
                <LocationPicker
                    onSelect={handleLocationSelect}
                    initialLocation={form.lat && form.lng ? { lat: form.lat, lng: form.lng } : undefined}
                />
            </div>
        );
    }

    // Area Measure Mode
    if (editMode === "area") {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="bg-white border-b px-4 py-3">
                    <div className="max-w-4xl mx-auto flex items-center gap-4">
                        <button onClick={() => setEditMode("form")} className="p-2 hover:bg-gray-100 rounded-lg">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-bold">วัดพื้นที่ใหม่</h1>
                    </div>
                </div>
                {form.lat && form.lng && (
                    <AreaMeasure
                        initialLocation={{ lat: form.lat, lng: form.lng }}
                        onSelect={handleAreaSelect}
                        onBack={() => setEditMode("form")}
                    />
                )}
            </div>
        );
    }

    // Form Mode
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
                    <Link href={`/web/plots/${plotId}`} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl font-bold">แก้ไขแปลง</h1>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-4">
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardContent className="p-6 space-y-6">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Location & Area Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditMode("location")}
                                    className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg hover:border-farm-green-500 hover:bg-farm-green-50 transition-colors"
                                >
                                    <MapPin className="w-5 h-5 text-farm-green-600" />
                                    <div className="text-left">
                                        <p className="font-medium">เปลี่ยนตำแหน่ง</p>
                                        {form.lat && form.lng ? (
                                            <p className="text-xs text-gray-500">
                                                {form.lat.toFixed(4)}, {form.lng.toFixed(4)}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-gray-400">ยังไม่ได้ระบุ</p>
                                        )}
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setEditMode("area")}
                                    disabled={!form.lat || !form.lng}
                                    className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg hover:border-farm-green-500 hover:bg-farm-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Ruler className="w-5 h-5 text-farm-green-600" />
                                    <div className="text-left">
                                        <p className="font-medium">วัดพื้นที่ใหม่</p>
                                        <p className="text-xs text-gray-500">{form.size?.toFixed(2) || 0} ไร่</p>
                                    </div>
                                </button>
                            </div>

                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <Label htmlFor="name">ชื่อแปลง *</Label>
                                    <Input
                                        id="name"
                                        value={form.name}
                                        onChange={(e) => handleChange("name", e.target.value)}
                                        placeholder="เช่น นาข้าว หลังบ้าน"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="size">ขนาด (ไร่)</Label>
                                    <Input
                                        id="size"
                                        type="number"
                                        step="0.01"
                                        value={form.size}
                                        onChange={(e) => handleChange("size", e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="address">ที่ตั้ง</Label>
                                    <Input
                                        id="address"
                                        value={form.address || ""}
                                        onChange={(e) => handleChange("address", e.target.value)}
                                        placeholder="ที่อยู่"
                                    />
                                </div>
                            </div>

                            {/* Environment Info */}
                            <div className="border-t pt-6">
                                <h3 className="font-medium mb-4">ข้อมูลสิ่งแวดล้อม</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="soilType">ประเภทดิน</Label>
                                        <select
                                            id="soilType"
                                            className="w-full px-3 py-2 border rounded-lg"
                                            value={form.soilType || ""}
                                            onChange={(e) => handleChange("soilType", e.target.value)}
                                        >
                                            {SOIL_TYPES.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <Label htmlFor="waterSource">แหล่งน้ำ</Label>
                                        <select
                                            id="waterSource"
                                            className="w-full px-3 py-2 border rounded-lg"
                                            value={form.waterSource || ""}
                                            onChange={(e) => handleChange("waterSource", e.target.value)}
                                        >
                                            {WATER_SOURCES.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <Label htmlFor="irrigation">ระบบชลประทาน</Label>
                                        <select
                                            id="irrigation"
                                            className="w-full px-3 py-2 border rounded-lg"
                                            value={form.irrigation || ""}
                                            onChange={(e) => handleChange("irrigation", e.target.value)}
                                        >
                                            {IRRIGATION_TYPES.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <Label htmlFor="sunExposure">แสงแดด</Label>
                                        <select
                                            id="sunExposure"
                                            className="w-full px-3 py-2 border rounded-lg"
                                            value={form.sunExposure || ""}
                                            onChange={(e) => handleChange("sunExposure", e.target.value)}
                                        >
                                            {SUN_EXPOSURES.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <Label htmlFor="elevation">ความสูง (เมตร)</Label>
                                        <Input
                                            id="elevation"
                                            type="number"
                                            step="0.1"
                                            value={form.elevation || ""}
                                            onChange={(e) => handleChange("elevation", e.target.value)}
                                            placeholder="เช่น 150"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="slope">ความลาด (%)</Label>
                                        <Input
                                            id="slope"
                                            type="number"
                                            step="0.1"
                                            value={form.slope || ""}
                                            onChange={(e) => handleChange("slope", e.target.value)}
                                            placeholder="เช่น 5"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t">
                                <Link href={`/web/plots/${plotId}`} className="flex-1">
                                    <Button type="button" variant="outline" className="w-full">
                                        ยกเลิก
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={isSaving} className="flex-1">
                                    {isSaving ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    บันทึก
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </div>
    );
}
