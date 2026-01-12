"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Loader2, ArrowLeft, TrendingUp, TrendingDown, Sprout, Wrench, AlertCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductSelector from "@/components/activities/product-selector";

const ImageUploader = dynamic(() => import("@/components/ui/image-uploader"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function EditActivityPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [activeTab, setActiveTab] = useState("EXPENSE");
    const [isLoading, setIsLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [plots, setPlots] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [categories, setCategories] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [cropTypes, setCropTypes] = useState<any[]>([]); // [NEW]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [cropVarieties, setCropVarieties] = useState<any[]>([]); // [NEW]

    const [error, setError] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [useCustomCategory, setUseCustomCategory] = useState(false);

    // [NEW] Selected Crop Type for filtering
    const [selectedCropTypeId, setSelectedCropTypeId] = useState<string>("");

    // Form Data
    const [formData, setFormData] = useState({
        plotId: "",
        cropCycleId: "",
        cropVarietyId: "", // [NEW]
        categoryId: "",
        customCategoryName: "",
        productId: "",
        customProductName: "",
        amount: "",
        quantity: "",
        unit: "",
        price: "",
        date: "",
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

    const fetchActivity = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/activities/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
            });
            if (res.ok) {
                const data = await res.json();

                // Set Form Data
                setActiveTab(data.type);
                setFormData({
                    plotId: data.plotId || "",
                    cropCycleId: data.cropCycleId || "",
                    cropVarietyId: data.cropCycle?.cropVarietyId || "", // [NEW] Get from Cycle
                    categoryId: data.categoryId || "",
                    customCategoryName: data.customCategoryName || "",
                    productId: data.productId || "",
                    customProductName: data.customProductName || "",
                    amount: data.amount ? data.amount.toString() : "",
                    quantity: data.quantity ? data.quantity.toString() : "",
                    unit: data.unit || "",
                    price: data.unitPrice ? data.unitPrice.toString() : "",
                    date: data.date ? new Date(data.date).toISOString().split("T")[0] : "",
                    description: data.description || "",
                });

                // Set Images
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (data.images && data.images.length > 0) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    setImages(data.images.map((img: any) => img.url));
                }

                // [NEW] If Planting, set selectedCropType from data
                if (data.type === 'PLANTING' && data.cropCycle?.cropVariety?.cropTypeId) {
                    setSelectedCropTypeId(data.cropCycle.cropVariety.cropTypeId);
                }

                // Custom Category Logic
                if (!data.categoryId && data.customCategoryName) {
                    setUseCustomCategory(true);
                }
            } else {
                setError("ไม่สามารถดึงข้อมูลกิจกรรมได้");
            }
        } catch (err) {
            console.error(err);
            setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        Promise.all([fetchPlots(), fetchCategories(), fetchCropTypes()]).then(() => {
            fetchActivity();
        });
    }, [id, fetchPlots, fetchCategories, fetchCropTypes, fetchActivity]);



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
            price: product.price ? product.price.toString() : prev.price,
            unit: product.unit || prev.unit
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
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
                amount: formData.amount ? parseFloat(formData.amount) : 0,
                quantity: formData.quantity ? parseFloat(formData.quantity) : undefined,
                unit: formData.unit || undefined,
                unitPrice: formData.price ? parseFloat(formData.price) : undefined,
                productId: formData.productId || undefined,
                customProductName: formData.customProductName || undefined,
                categoryId: formData.categoryId || undefined,
                customCategoryName: formData.customCategoryName || undefined
            };

            const res = await fetch(`${API_URL}/activities/${id}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "บันทึกการแก้ไขไม่สำเร็จ");
            }

            router.back();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("ยืนยันการลบกิจกรรมนี้?")) return;
        try {
            const res = await fetch(`${API_URL}/activities/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
            });
            if (res.ok) {
                router.back();
            } else {
                alert("ลบไม่สำเร็จ");
            }
        } catch {
            alert("เกิดข้อผิดพลาด");
        }
    };

    if (isLoading) {
        return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
    }

    return (
        <div className="max-w-3xl mx-auto pb-10 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <Link
                    href="#"
                    onClick={() => router.back()}
                    className="inline-flex items-center text-gray-500 hover:text-gray-700"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    กลับ
                </Link>

                <Button variant="ghost" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4 mr-2" /> ลบกิจกรรม
                </Button>
            </div>

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
                    <TabsTrigger value="PLANTING" className="flex items-center gap-2 data-[state=active]:bg-farm-green-50 data-[state=active]:text-farm-green-700">
                        <Sprout className="w-4 h-4" />
                        <span className="hidden sm:inline">การปลูก</span>
                    </TabsTrigger>
                </TabsList>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>แก้ไขกิจกรรม</CardTitle>
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
                                        disabled={true} // Usually can't move activity between plots easily as it affects cycle
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
                                        defaultValue={formData.customProductName || ""}
                                    />
                                    {formData.productId && (
                                        <p className="text-xs text-green-600 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> เชื่อมโยงกับสินค้าในระบบ
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
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "บันทึกการแก้ไข"}
                                </Button>
                            </div>

                        </CardContent>
                    </Card>
                </form>
            </Tabs>
        </div>
    );
}
