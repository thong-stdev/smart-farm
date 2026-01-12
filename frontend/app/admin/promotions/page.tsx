"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Megaphone,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    Calendar,
    Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Promotion {
    id: string;
    productId: string;
    sponsorName?: string;
    campaignName?: string;
    bidAmount: number;
    priority?: number;
    startAt: string;
    endAt: string;
    aiBoostFactor: number;
    isActive: boolean;
    product?: {
        id: string;
        name: string;
        imageUrl?: string;
        brand?: { name: string };
    };
    createdAt: string;
}

interface Product {
    id: string;
    name: string;
    brand?: { name: string };
}

export default function PromotionsPage() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Promotion | null>(null);
    const [filterActive, setFilterActive] = useState<boolean | null>(null);

    const [formData, setFormData] = useState({
        productId: "",
        sponsorName: "",
        campaignName: "",
        bidAmount: 0,
        priority: 0,
        startAt: "",
        endAt: "",
        aiBoostFactor: 1.0,
    });

    const fetchData = useCallback(async () => {
        try {
            const token = localStorage.getItem("adminToken");
            if (!token) return;

            const headers = {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            };
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

            const params = filterActive !== null ? `?isActive=${filterActive}` : "";

            const [promosRes, productsRes] = await Promise.all([
                fetch(`${apiUrl}/admin/promotions${params}`, { headers }),
                fetch(`${apiUrl}/admin/products?limit=100`, { headers }),
            ]);

            if (promosRes.ok) {
                const data = await promosRes.json();
                setPromotions(data.items || []);
            }

            if (productsRes.ok) {
                const data = await productsRes.json();
                setProducts(data.items || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [filterActive]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem("adminToken");
            if (!token) return;

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
            const method = editingItem ? "PATCH" : "POST";
            const url = editingItem
                ? `${apiUrl}/admin/promotions/${editingItem.id}`
                : `${apiUrl}/admin/promotions`;

            const res = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setIsDialogOpen(false);
                setEditingItem(null);
                resetForm();
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("ยืนยันการลบ Promotion นี้?")) return;

        try {
            const token = localStorage.getItem("adminToken");
            if (!token) return;

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
            const res = await fetch(`${apiUrl}/admin/promotions/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const resetForm = () => {
        setFormData({
            productId: "",
            sponsorName: "",
            campaignName: "",
            bidAmount: 0,
            priority: 0,
            startAt: "",
            endAt: "",
            aiBoostFactor: 1.0,
        });
    };

    const openEditDialog = (item: Promotion) => {
        setEditingItem(item);
        setFormData({
            productId: item.productId,
            sponsorName: item.sponsorName || "",
            campaignName: item.campaignName || "",
            bidAmount: item.bidAmount,
            priority: item.priority || 0,
            startAt: item.startAt.split("T")[0],
            endAt: item.endAt.split("T")[0],
            aiBoostFactor: item.aiBoostFactor,
        });
        setIsDialogOpen(true);
    };

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
                    <h1 className="text-2xl font-bold text-gray-900">จัดการ Sponsors/Promotions</h1>
                    <p className="text-gray-500">จัดการโปรโมชันและโฆษณาสินค้า</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open: boolean) => {
                    setIsDialogOpen(open);
                    if (!open) {
                        setEditingItem(null);
                        resetForm();
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            เพิ่ม Promotion
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>
                                {editingItem ? "แก้ไข Promotion" : "เพิ่ม Promotion ใหม่"}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                            <div>
                                <Label>สินค้า *</Label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={formData.productId}
                                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                                >
                                    <option value="">เลือกสินค้า</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} {p.brand?.name ? `(${p.brand.name})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>ชื่อ Sponsor</Label>
                                    <Input
                                        value={formData.sponsorName}
                                        onChange={(e) => setFormData({ ...formData, sponsorName: e.target.value })}
                                        placeholder="ชื่อบริษัท/แบรนด์"
                                    />
                                </div>
                                <div>
                                    <Label>ชื่อแคมเปญ</Label>
                                    <Input
                                        value={formData.campaignName}
                                        onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                                        placeholder="ชื่อแคมเปญ"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Bid Amount (บาท) *</Label>
                                    <Input
                                        type="number"
                                        value={formData.bidAmount}
                                        onChange={(e) => setFormData({ ...formData, bidAmount: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <Label>Priority</Label>
                                    <Input
                                        type="number"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>วันเริ่มต้น *</Label>
                                    <Input
                                        type="date"
                                        value={formData.startAt}
                                        onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>วันสิ้นสุด *</Label>
                                    <Input
                                        type="date"
                                        value={formData.endAt}
                                        onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>AI Boost Factor</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={formData.aiBoostFactor}
                                    onChange={(e) => setFormData({ ...formData, aiBoostFactor: Number(e.target.value) })}
                                />
                                <p className="text-xs text-gray-500 mt-1">1.0 = ปกติ, 2.0 = คะแนน x2</p>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                                    ยกเลิก
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={handleSubmit}
                                    disabled={!formData.productId || !formData.startAt || !formData.endAt}
                                >
                                    {editingItem ? "บันทึก" : "เพิ่ม"}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                <Button
                    variant={filterActive === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterActive(null)}
                >
                    ทั้งหมด
                </Button>
                <Button
                    variant={filterActive === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterActive(true)}
                >
                    Active
                </Button>
                <Button
                    variant={filterActive === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterActive(false)}
                >
                    Inactive
                </Button>
            </div>

            {/* List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Megaphone className="w-5 h-5" />
                        Promotions ({promotions.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {promotions.length === 0 ? (
                        <div className="text-center py-8">
                            <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">ยังไม่มี Promotion</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-2">สินค้า</th>
                                        <th className="text-left py-3 px-2">Sponsor</th>
                                        <th className="text-left py-3 px-2">Bid</th>
                                        <th className="text-left py-3 px-2">ระยะเวลา</th>
                                        <th className="text-left py-3 px-2">Boost</th>
                                        <th className="text-left py-3 px-2">สถานะ</th>
                                        <th className="text-right py-3 px-2">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {promotions.map((promo) => {
                                        const isExpired = new Date(promo.endAt) < new Date();
                                        const isNotStarted = new Date(promo.startAt) > new Date();
                                        return (
                                            <tr key={promo.id} className="border-b hover:bg-gray-50">
                                                <td className="py-3 px-2">
                                                    <div className="flex items-center gap-2">
                                                        <Package className="w-4 h-4 text-gray-400" />
                                                        <span className="font-medium">{promo.product?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <div>
                                                        <p className="font-medium">{promo.sponsorName || "-"}</p>
                                                        {promo.campaignName && (
                                                            <p className="text-sm text-gray-500">{promo.campaignName}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <span className="font-medium text-green-600">
                                                        ฿{Number(promo.bidAmount).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 text-sm">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(promo.startAt).toLocaleDateString("th-TH")} -{" "}
                                                        {new Date(promo.endAt).toLocaleDateString("th-TH")}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <span className={`px-2 py-1 rounded text-sm ${promo.aiBoostFactor > 1 ? "bg-purple-100 text-purple-700" : "bg-gray-100"}`}>
                                                        x{promo.aiBoostFactor}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2">
                                                    {isExpired ? (
                                                        <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-sm">หมดอายุ</span>
                                                    ) : isNotStarted ? (
                                                        <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-sm">รอเริ่ม</span>
                                                    ) : promo.isActive ? (
                                                        <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-sm">Active</span>
                                                    ) : (
                                                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-sm">Inactive</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-2 text-right">
                                                    <div className="flex gap-1 justify-end">
                                                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(promo)}>
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(promo.id)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
