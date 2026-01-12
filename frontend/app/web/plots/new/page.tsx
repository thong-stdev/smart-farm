"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, MapPin, Ruler, FileText, Check } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Dynamic imports for Leaflet (ต้องใช้ dynamic เพราะ Leaflet ไม่รองรับ SSR)
const LocationPicker = dynamic(() => import("@/components/plots/LocationPicker"), { ssr: false });
const AreaMeasure = dynamic(() => import("@/components/plots/AreaMeasure"), { ssr: false });

interface PlotData {
    location: { lat: number; lng: number } | null;
    polygon: { lat: number; lng: number }[] | null;
    area: number | null; // ไร่
    name: string;
    address: string;
    soilType: string;
    waterSource: string;
    irrigation: string;
    sunExposure: string;
}

const SOIL_TYPES = [
    { value: "", label: "-- เลือกประเภทดิน --" },
    { value: "CLAY", label: "ดินเหนียว" },
    { value: "LOAM", label: "ดินร่วน" },
    { value: "SAND", label: "ดินทราย" },
    { value: "SILT", label: "ดินตะกอน" },
    { value: "PEAT", label: "ดินพรุ" },
];

const WATER_SOURCES = [
    { value: "", label: "-- เลือกแหล่งน้ำ --" },
    { value: "WELL", label: "บ่อบาดาล" },
    { value: "RIVER", label: "แม่น้ำ/ลำคลอง" },
    { value: "RAIN", label: "น้ำฝน" },
    { value: "POND", label: "บ่อเก็บน้ำ" },
    { value: "TAP", label: "ประปา" },
];

const IRRIGATION_TYPES = [
    { value: "", label: "-- เลือกระบบชลประทาน --" },
    { value: "DRIP", label: "น้ำหยด" },
    { value: "SPRINKLER", label: "สปริงเกอร์" },
    { value: "FLOOD", label: "ท่วมขัง" },
    { value: "FURROW", label: "ร่อง" },
    { value: "MANUAL", label: "รดด้วยมือ" },
];

const SUN_EXPOSURES = [
    { value: "", label: "-- เลือกระดับแสงแดด --" },
    { value: "FULL", label: "แดดจัด" },
    { value: "PARTIAL", label: "ร่มรำไร" },
    { value: "SHADE", label: "ร่มเงา" },
];

const steps = [
    { id: 1, title: "เลือกตำแหน่ง", icon: MapPin },
    { id: 2, title: "วัดพื้นที่", icon: Ruler },
    { id: 3, title: "กรอกข้อมูล", icon: FileText },
];

export default function NewPlotPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [plotData, setPlotData] = useState<PlotData>({
        location: null,
        polygon: null,
        area: null,
        name: "",
        address: "",
        soilType: "",
        waterSource: "",
        irrigation: "",
        sunExposure: "",
    });

    // Step 1: บันทึกตำแหน่ง
    const handleLocationSelect = (lat: number, lng: number, address: string) => {
        setPlotData(prev => ({ ...prev, location: { lat, lng }, address }));
        setCurrentStep(2);
    };

    // Step 2: บันทึกพื้นที่
    const handleAreaSelect = (polygon: { lat: number; lng: number }[], area: number) => {
        setPlotData(prev => ({ ...prev, polygon, area }));
        setCurrentStep(3);
    };

    // Step 3: บันทึกแปลง
    const handleSubmit = async () => {
        if (!plotData.name.trim()) {
            setError("กรุณากรอกชื่อแปลง");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/plots`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: plotData.name,
                    size: plotData.area || 0,
                    lat: plotData.location?.lat,
                    lng: plotData.location?.lng,
                    address: plotData.address,
                    polygon: plotData.polygon,
                    soilType: plotData.soilType || null,
                    waterSource: plotData.waterSource || null,
                    irrigation: plotData.irrigation || null,
                    sunExposure: plotData.sunExposure || null,
                }),
            });

            if (!res.ok) {
                throw new Error("บันทึกแปลงไม่สำเร็จ");
            }

            router.push("/web/plots");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-4 py-3">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <Link href="/web/plots" className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl font-bold">เพิ่มแปลงใหม่</h1>
                </div>
            </div>

            {/* Steps Indicator */}
            <div className="bg-white border-b px-4 py-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div className={`flex items-center gap-2 ${step.id <= currentStep ? "text-farm-green-600" : "text-gray-400"}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step.id < currentStep ? "bg-farm-green-600 text-white" :
                                        step.id === currentStep ? "bg-farm-green-100 text-farm-green-600 border-2 border-farm-green-600" :
                                            "bg-gray-100 text-gray-400"
                                        }`}>
                                        {step.id < currentStep ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                                    </div>
                                    <span className="hidden sm:block font-medium">{step.title}</span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`w-12 sm:w-24 h-1 mx-2 rounded ${step.id < currentStep ? "bg-farm-green-600" : "bg-gray-200"}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1">
                {currentStep === 1 && (
                    <LocationPicker onSelect={handleLocationSelect} />
                )}

                {currentStep === 2 && plotData.location && (
                    <AreaMeasure
                        initialLocation={plotData.location}
                        onSelect={handleAreaSelect}
                        onBack={() => setCurrentStep(1)}
                    />
                )}

                {currentStep === 3 && (
                    <div className="max-w-2xl mx-auto p-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>ข้อมูลแปลง</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Preview Map */}
                                <div className="h-48 bg-gray-100 rounded-lg overflow-hidden">
                                    <LocationPicker
                                        readOnly
                                        initialLocation={plotData.location!}
                                        polygon={plotData.polygon!}
                                    />
                                </div>

                                {/* Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">ชื่อแปลง *</Label>
                                    <Input
                                        id="name"
                                        placeholder="เช่น นาข้าว หลังบ้าน"
                                        value={plotData.name}
                                        onChange={(e) => setPlotData(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>

                                {/* Address */}
                                <div className="space-y-2">
                                    <Label>ที่ตั้ง</Label>
                                    <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                                        {plotData.address || "ไม่สามารถระบุที่ตั้งได้"}
                                    </div>
                                </div>

                                {/* Area */}
                                <div className="space-y-2">
                                    <Label>ขนาดพื้นที่</Label>
                                    <div className="p-3 bg-farm-green-50 rounded-lg text-lg font-bold text-farm-green-700">
                                        {plotData.area?.toFixed(2) || 0} ไร่
                                    </div>
                                </div>

                                {/* Coordinates */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>ละติจูด</Label>
                                        <div className="p-2 bg-gray-50 rounded text-sm font-mono">
                                            {plotData.location?.lat.toFixed(6)}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>ลองจิจูด</Label>
                                        <div className="p-2 bg-gray-50 rounded text-sm font-mono">
                                            {plotData.location?.lng.toFixed(6)}
                                        </div>
                                    </div>
                                </div>

                                {/* Environment Info */}
                                <div className="border-t pt-4 mt-4">
                                    <p className="font-medium text-gray-700 mb-3">ข้อมูลสิ่งแวดล้อม (เผื่อ AI แนะนำ)</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>ประเภทดิน</Label>
                                            <select
                                                className="w-full px-3 py-2 border rounded-lg bg-white"
                                                value={plotData.soilType}
                                                onChange={(e) => setPlotData(prev => ({ ...prev, soilType: e.target.value }))}
                                            >
                                                {SOIL_TYPES.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>แหล่งน้ำ</Label>
                                            <select
                                                className="w-full px-3 py-2 border rounded-lg bg-white"
                                                value={plotData.waterSource}
                                                onChange={(e) => setPlotData(prev => ({ ...prev, waterSource: e.target.value }))}
                                            >
                                                {WATER_SOURCES.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>ระบบชลประทาน</Label>
                                            <select
                                                className="w-full px-3 py-2 border rounded-lg bg-white"
                                                value={plotData.irrigation}
                                                onChange={(e) => setPlotData(prev => ({ ...prev, irrigation: e.target.value }))}
                                            >
                                                {IRRIGATION_TYPES.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>แสงแดด</Label>
                                            <select
                                                className="w-full px-3 py-2 border rounded-lg bg-white"
                                                value={plotData.sunExposure}
                                                onChange={(e) => setPlotData(prev => ({ ...prev, sunExposure: e.target.value }))}
                                            >
                                                {SUN_EXPOSURES.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentStep(2)}
                                        className="flex-1"
                                    >
                                        ย้อนกลับ
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isLoading}
                                        className="flex-1"
                                    >
                                        {isLoading ? "กำลังบันทึก..." : "บันทึกแปลง"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
