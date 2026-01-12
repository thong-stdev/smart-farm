"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Loader2, ArrowLeft, TrendingUp, TrendingDown, Sprout, Wrench, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductSelector from "@/components/activities/product-selector";

const ImageUploader = dynamic(() => import("@/components/ui/image-uploader"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function NewActivityPage() {
    return (
        <Suspense fallback={
            <div className="max-w-3xl mx-auto py-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-farm-green-600" />
            </div>
        }>
            <NewActivityForm />
        </Suspense>
    );
}

function NewActivityForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // ID from Params
    const urlPlotId = searchParams.get("plotId") || "";
    const urlCropCycleId = searchParams.get("cropCycleId") || "";

    // State
    const [activeTab, setActiveTab] = useState("EXPENSE");
    const [isLoading, setIsLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [plots, setPlots] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [categories, setCategories] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [cropTypes, setCropTypes] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [cropVarieties, setCropVarieties] = useState<any[]>([]); // [NEW]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedPlot, setSelectedPlot] = useState<any | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [cycleInfo, setCycleInfo] = useState<any | null>(null);
    const [error, setError] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [useCustomCategory, setUseCustomCategory] = useState(false);

    // [NEW] Selected Crop Type for filtering
    const [selectedCropTypeId, setSelectedCropTypeId] = useState<string>("");

    // Form Data
    const [formData, setFormData] = useState({
        plotId: urlPlotId,
        cropCycleId: urlCropCycleId,
        cropVarietyId: "", // [NEW]
        categoryId: "",
        customCategoryName: "",
        productId: "",
        customProductName: "",
        amount: "",
        quantity: "",
        unit: "",
        price: "", // Unit Price
        date: new Date().toISOString().split("T")[0],
        description: "",
    });

    const fetchPlots = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/plots`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (res.ok) { setPlots(await res.json()); }
        } catch (err) { console.error(err); }
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/activities/categories`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (res.ok) { setCategories(await res.json()); }
        } catch (err) { console.error(err); }
    }, []);

    // [NEW] Fetch Crop Types
    const fetchCropTypes = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/crop-types`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (res.ok) { setCropTypes(await res.json()); }
        } catch (err) { console.error(err); }
    }, []);

    const fetchCropVarieties = useCallback(async (typeId: string) => {
        try {
            const res = await fetch(`${API_URL}/crop-types/${typeId}/varieties`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (res.ok) { setCropVarieties(await res.json()); }
        } catch (err) { console.error(err); }
    }, []);

    const fetchCycleInfo = useCallback(async (cycleId: string) => {
        try {
            const res = await fetch(`${API_URL}/crop-cycles/${cycleId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
            });
            if (res.ok) {
                const data = await res.json();
                setCycleInfo(data);
                if (data.status === 'COMPLETED') {
                    setError("รอบการปลูกนี้เสร็จสิ้นแล้ว");
                }
            }
        } catch (err) { console.error(err); }
    }, []);

    // Fetch Initial Data
    useEffect(() => {
        fetchPlots();
        fetchCategories();
        fetchCropTypes();
    }, [fetchPlots, fetchCategories, fetchCropTypes]);

    // Update selected plot
    useEffect(() => {
        if (formData.plotId && plots.length > 0) {
            const plot = plots.find(p => p.id === formData.plotId);
            setSelectedPlot(plot || null);
            // If plot changes and no cycle selected, try to auto select active cycle
            if (plot && !formData.cropCycleId) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const activeCycle = plot.cropCycles?.find((c: any) => c.status === 'ACTIVE');
                if (activeCycle) {
                    setFormData(prev => ({ ...prev, cropCycleId: activeCycle.id }));
                }
            }
        } else {
            setSelectedPlot(null);
        }
    }, [formData.plotId, formData.cropCycleId, plots]);

    // Fetch Cycle Info
    useEffect(() => {
        if (formData.cropCycleId) {
            fetchCycleInfo(formData.cropCycleId);
        } else {
            setCycleInfo(null);
        }
    }, [formData.cropCycleId, fetchCycleInfo]);

    // [NEW] Fetch Varieties when Type changes
    useEffect(() => {
        if (selectedCropTypeId) {
            fetchCropVarieties(selectedCropTypeId);
        } else {
            setCropVarieties([]);
        }
    }, [selectedCropTypeId, fetchCropVarieties]);

    const handleProductSelect = (product: { productId?: string; customProductName?: string; price?: number; unit?: string }) => {
        setFormData(prev => ({
            ...prev,
            productId: product.productId || "",
            customProductName: product.customProductName || "",
            // Use suggested price/unit if available and not already set? Or overwrite? 
            // Better to overwrite for convenience, user can edit.
            price: product.price ? product.price.toString() : prev.price,
            unit: product.unit || prev.unit
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            // Validation
            if (!formData.categoryId && !formData.customCategoryName && activeTab !== 'PLANTING') {
                throw new Error("กรุณาระบุหมวดหมู่");
            }

            const payload = {
                type: activeTab,
                date: new Date(formData.date),
                plotId: formData.plotId || undefined,
                cropCycleId: formData.cropCycleId || undefined,
                cropVarietyId: formData.cropVarietyId || undefined, // [NEW]
                description: formData.description,
                images: images.length > 0 ? images : undefined,
                // Amounts
                amount: formData.amount ? parseFloat(formData.amount) : 0,
                quantity: formData.quantity ? parseFloat(formData.quantity) : undefined,
                unit: formData.unit || undefined,
                unitPrice: formData.price ? parseFloat(formData.price) : undefined,
                // Custom/Product
                productId: formData.productId || undefined,
                customProductName: formData.customProductName || undefined,
                // Category
                categoryId: formData.categoryId || undefined,
                customCategoryName: formData.customCategoryName || undefined
            };

            const res = await fetch(`${API_URL}/activities`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "บันทึกไม่สำเร็จ");
            }

            // Success redirect
            const backUrl = formData.cropCycleId ? `/web/crop-cycles/${formData.cropCycleId}` :
                formData.plotId ? `/web/plots/${formData.plotId}` : '/web/activities';
            router.push(backUrl);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const isPlantingDisabled = cycleInfo?.hasPlanting; // Logic to disable Planting tab if already planted?
    // Actually, user might want to edit? No, this is CREATE page. 
    // If cycle already has planting, creating another Planting activity in SAME cycle is Blocked by backend.
    // Frontend should warn or disable.

    return (
        <div className="max-w-3xl mx-auto pb-10 animate-fade-in">
            <Link
                href={urlCropCycleId ? `/web/crop-cycles/${urlCropCycleId}` : "/web/activities"}
                className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-6"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                กลับ
            </Link>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                    <TabsTrigger value="EXPENSE" className="flex items-center gap-2 data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:border-red-200">
                        <TrendingDown className="w-4 h-4" />
                        <span className="hidden sm:inline">รายจ่าย</span>
                    </TabsTrigger>
                    <TabsTrigger value="INCOME" className="flex items-center gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-green-200">
                        <TrendingUp className="w-4 h-4" />
                        <span className="hidden sm:inline">รายรับ</span>
                    </TabsTrigger>
                    <TabsTrigger value="GENERAL" className="flex items-center gap-2">
                        <Wrench className="w-4 h-4" />
                        <span className="hidden sm:inline">ทั่วไป</span>
                    </TabsTrigger>
                    <TabsTrigger value="PLANTING" disabled={isPlantingDisabled} className="flex items-center gap-2 data-[state=active]:bg-farm-green-50 data-[state=active]:text-farm-green-700">
                        <Sprout className="w-4 h-4" />
                        <span className="hidden sm:inline">การปลูก</span>
                    </TabsTrigger>
                </TabsList>

                {/* [NEW] Magic Input Section */}
                <Card className="mb-6 border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-blue-700">
                                <span className="text-xl">✨</span>
                                ให้ AI ช่วยกรอกข้อมูล (Magic Input)
                            </Label>
                            <div className="flex gap-2">
                                <Textarea
                                    placeholder="พิมพ์กิจกรรมที่ทำวันนี้... เช่น 'ซื้อปุ๋ยยูเรีย 2 กระสอบ 1200 บาท ลงแปลง A'"
                                    className="bg-white resize-none"
                                    id="magic-input"
                                />
                                <Button
                                    type="button"
                                    className="bg-blue-600 hover:bg-blue-700 shrink-0"
                                    onClick={async () => {
                                        const input = document.getElementById('magic-input') as HTMLTextAreaElement;
                                        if (!input.value) return;

                                        setIsLoading(true);
                                        try {
                                            const res = await fetch(`${API_URL}/activities/parse`, {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                                                },
                                                body: JSON.stringify({ text: input.value })
                                            });

                                            if (res.ok) {
                                                const data = await res.json();
                                                console.log("AI Response:", data);

                                                // 1. Determine Category Match
                                                let matchCatId = "";
                                                let matchCatName = "";
                                                let useParams = false;

                                                if (data.category) {
                                                    // Normalize for matching
                                                    const cleanCat = data.category.trim();
                                                    // Fuzzy match: Database category includes AI cat OR AI cat includes Database cat
                                                    const foundCat = categories.find(c =>
                                                        c.name.includes(cleanCat) || cleanCat.includes(c.name)
                                                    );

                                                    if (foundCat) {
                                                        matchCatId = foundCat.id;
                                                        matchCatName = "";
                                                        useParams = false;
                                                    } else {
                                                        matchCatId = "";
                                                        matchCatName = cleanCat;
                                                        useParams = true;
                                                    }
                                                }

                                                // 2. Determine Plot Match (Existing logic)
                                                let matchPlotId = "";
                                                if (data.plotName) {
                                                    const foundPlot = plots.find(p =>
                                                        p.name.toLowerCase().includes(data.plotName.toLowerCase()) ||
                                                        data.plotName.toLowerCase().includes(p.name.toLowerCase())
                                                    );
                                                    if (foundPlot) matchPlotId = foundPlot.id;
                                                }

                                                // 3. Update States
                                                setUseCustomCategory(useParams);
                                                if (data.type) setActiveTab(data.type);

                                                setFormData(prev => ({
                                                    ...prev,
                                                    amount: data.amount ? data.amount.toString() : prev.amount,
                                                    description: data.description || prev.description,
                                                    date: data.date ? new Date(data.date).toISOString().split('T')[0] : prev.date,
                                                    quantity: data.quantity ? data.quantity.toString() : prev.quantity,
                                                    unit: data.unit || prev.unit,
                                                    customProductName: data.product || prev.customProductName,

                                                    // Apply matches
                                                    categoryId: matchCatId || prev.categoryId,
                                                    customCategoryName: matchCatName || prev.customCategoryName,
                                                    plotId: matchPlotId || prev.plotId
                                                }));
                                            }
                                        } catch (e) {
                                            console.error(e);
                                            setError("AI ไม่สามารถวิเคราะห์ข้อมูลได้ ในขณะนี้");
                                        } finally {
                                            setIsLoading(false);
                                        }
                                    }}
                                >
                                    <span className="sr-only">Analyze</span>
                                    วิเคราะห์
                                </Button>
                            </div>
                            <p className="text-xs text-blue-400">
                                ลองพิมพ์: &quot;ขายข้าวหอมมะลิ 5 ตันๆละ 12000 บาท ได้เงินเมื่อวาน&quot;
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {activeTab === 'EXPENSE' && "บันทึกรายจ่าย"}
                                {activeTab === 'INCOME' && "บันทึกรายรับ"}
                                {activeTab === 'GENERAL' && "บันทึกกิจกรรมทั่วไป"}
                                {activeTab === 'PLANTING' && "บันทึกการเริ่มปลูก"}
                            </CardTitle>
                            <CardDescription>
                                {selectedPlot?.name ? `แปลง: ${selectedPlot.name}` : "กรุณาเลือกแปลง"}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> {error}
                                </div>
                            )}

                            {/* Common Fields: Date & Plot */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>วันที่ *</Label>
                                    <Input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>แปลง *</Label>
                                    <Select
                                        value={formData.plotId}
                                        onValueChange={(value) => setFormData({ ...formData, plotId: value, cropCycleId: "" })}
                                        disabled={!!urlPlotId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="เลือกแปลง" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {plots.map((plot) => (
                                                <SelectItem key={plot.id} value={plot.id}>
                                                    {plot.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* [NEW] Crop Type Selector (Only for PLANTING) */}
                                {activeTab === 'PLANTING' && (
                                    <div className="space-y-2">
                                        <Label>ประเภทพืช</Label>
                                        <Select
                                            value={selectedCropTypeId}
                                            onValueChange={(value) => {
                                                setSelectedCropTypeId(value);
                                                setFormData(prev => ({ ...prev, cropCycleId: "", cropVarietyId: "" }));
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="เลือกพืชที่ปลูก" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {cropTypes.map((type) => (
                                                    <SelectItem key={type.id} value={type.id}>
                                                        {type.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* [NEW] Crop Variety Selector (Instead of Cycle, Only for PLANTING) */}
                                {activeTab === 'PLANTING' && selectedCropTypeId && (
                                    <div className="space-y-2">
                                        <Label>พันธุ์พืช</Label>
                                        <Select
                                            value={formData.cropVarietyId}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, cropVarietyId: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="เลือกพันธุ์พืช" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {cropVarieties.map((variety) => (
                                                    <SelectItem key={variety.id} value={variety.id}>
                                                        {variety.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}


                            </div>

                            {/* Category Selection (Not for Planting) */}
                            {activeTab !== 'PLANTING' && (
                                <div className="space-y-2">
                                    <Label>หมวดหมู่ *</Label>
                                    <div className="flex gap-2">
                                        {!useCustomCategory ? (
                                            <Select
                                                value={formData.categoryId}
                                                onValueChange={(value) => {
                                                    if (value === 'CUSTOM') {
                                                        setUseCustomCategory(true);
                                                        setFormData({ ...formData, categoryId: "" });
                                                    } else {
                                                        setFormData({ ...formData, categoryId: value });
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="เลือกหมวดหมู่" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map((cat) => (
                                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                    ))}
                                                    <SelectItem value="CUSTOM" className="text-blue-600 font-medium">+ กำหนดเอง</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="flex gap-2 w-full">
                                                <Input
                                                    placeholder="ระบุชื่อหมวดหมู่..."
                                                    value={formData.customCategoryName}
                                                    onChange={(e) => setFormData({ ...formData, customCategoryName: e.target.value })}
                                                    autoFocus
                                                />
                                                <Button variant="outline" onClick={() => setUseCustomCategory(false)}>เลือกจากรายการ</Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Product Selector (Expense/Income) */}
                            {(activeTab === 'EXPENSE' || activeTab === 'INCOME') && (
                                <div className="space-y-2">
                                    <Label>สินค้า / รายการ *</Label>
                                    <ProductSelector
                                        onSelect={handleProductSelect}
                                        defaultValue={formData.customProductName}
                                    />
                                    {formData.productId && (
                                        <p className="text-xs text-green-600 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> เลือกจากฐานข้อมูล
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Money & Quantity */}
                            {(activeTab === 'EXPENSE' || activeTab === 'INCOME') && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="col-span-2 space-y-2">
                                        <Label>จำนวนเงิน (บาท) *</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            className="text-lg font-medium"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>จำนวน (ปริมาณ)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="เช่น 1"
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>หน่วย</Label>
                                        <Input
                                            placeholder="เช่น กระสอบ"
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            <div className="space-y-2">
                                <Label>รายละเอียดเพิ่มเติม</Label>
                                <Textarea
                                    placeholder="บันทึกช่วยจำ..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            {/* Image Uploader */}
                            <div className="space-y-2">
                                <Label>รูปภาพประกอบ</Label>
                                <ImageUploader
                                    images={images}
                                    onChange={setImages}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button type="submit" className="flex-1" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "บันทึกข้อมูล"}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => router.back()}>
                                    ยกเลิก
                                </Button>
                            </div>

                        </CardContent>
                    </Card>
                </form>
            </Tabs>
        </div>
    );
}
