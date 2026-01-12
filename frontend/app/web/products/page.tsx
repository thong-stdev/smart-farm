"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Package,
    Plus,
    Search,

    MoreVertical,
    Loader2,
    Edit,
    Trash2,
    FlaskConical,
    Leaf,
    Droplets,
    Wrench,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface UserProduct {
    id: string;
    name: string;
    category: string;
    type?: string;
    quantity: number;
    unit?: string;
    brand?: string;
    price?: number;
    note?: string;
    productId?: string;
    product?: {
        id: string;
        name: string;
        imageUrl?: string;
        brand?: { name: string };
    };
    createdAt: string;
}

interface Stats {
    category: string;
    count: number;
    totalQuantity: number;
}

// หมวดหมู่และไอคอน
const CATEGORIES = [
    { value: "ปุ๋ย", label: "ปุ๋ย", icon: FlaskConical, color: "text-green-600 bg-green-100" },
    { value: "ยา", label: "ยา/สารเคมี", icon: Droplets, color: "text-blue-600 bg-blue-100" },
    { value: "เมล็ด", label: "เมล็ดพันธุ์", icon: Leaf, color: "text-amber-600 bg-amber-100" },
    { value: "วัสดุ", label: "วัสดุอื่นๆ", icon: Wrench, color: "text-gray-600 bg-gray-100" },
];

export default function ProductsPage() {
    const [items, setItems] = useState<UserProduct[]>([]);
    const [stats, setStats] = useState<Stats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<UserProduct | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        category: "ปุ๋ย",
        type: "",
        quantity: 0,
        unit: "กก.",
        brand: "",
        price: 0,
        note: "",
    });



    const fetchData = useCallback(async () => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) return;

            const headers = {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            };

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

            const params = selectedCategory ? `?category=${encodeURIComponent(selectedCategory)}` : "";

            const [itemsRes, statsRes] = await Promise.all([
                fetch(`${apiUrl}/user-products${params}`, { headers }),
                fetch(`${apiUrl}/user-products/stats`, { headers }),
            ]);

            if (itemsRes.ok) {
                const data = await itemsRes.json();
                setItems(data);
            }

            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedCategory]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) return;

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
            const method = editingItem ? "PATCH" : "POST";
            const url = editingItem
                ? `${apiUrl}/user-products/${editingItem.id}`
                : `${apiUrl}/user-products`;

            const res = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setIsAddDialogOpen(false);
                setEditingItem(null);
                resetForm();
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("ยืนยันการลบสินค้า/วัสดุ นี้?")) return;

        try {
            const token = localStorage.getItem("accessToken");
            if (!token) return;

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

            const res = await fetch(`${apiUrl}/user-products/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.ok) {
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            category: "ปุ๋ย",
            type: "",
            quantity: 0,
            unit: "กก.",
            brand: "",
            price: 0,
            note: "",
        });
    };

    const openEditDialog = (item: UserProduct) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            category: item.category,
            type: item.type || "",
            quantity: item.quantity,
            unit: item.unit || "กก.",
            brand: item.brand || "",
            price: item.price || 0,
            note: item.note || "",
        });
        setIsAddDialogOpen(true);
    };

    const getCategoryInfo = (category: string) => {
        return CATEGORIES.find(c => c.value === category) || CATEGORIES[3];
    };

    // Filter items by search
    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()))
    );

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">สินค้า/วัสดุ ของฉัน</h1>
                    <p className="text-gray-500">จัดการปุ๋ย ยา เมล็ดพันธุ์ และวัสดุอื่นๆ</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={(open: boolean) => {
                    setIsAddDialogOpen(open);
                    if (!open) {
                        setEditingItem(null);
                        resetForm();
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            เพิ่มสินค้า/วัสดุ
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {editingItem ? "แก้ไขสินค้า/วัสดุ" : "เพิ่มสินค้า/วัสดุ ใหม่"}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>ชื่อสินค้า *</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="เช่น ปุ๋ย 15-15-15"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>หมวดหมู่ *</Label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-lg"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label>ประเภทย่อย</Label>
                                    <Input
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        placeholder="เช่น ปุ๋ยเคมี"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>จำนวน</Label>
                                    <Input
                                        type="number"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <Label>หน่วย</Label>
                                    <Input
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        placeholder="กก., ลิตร, ถุง"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>แบรนด์</Label>
                                    <Input
                                        value={formData.brand}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                        placeholder="ชื่อแบรนด์"
                                    />
                                </div>
                                <div>
                                    <Label>ราคา (บาท)</Label>
                                    <Input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>หมายเหตุ</Label>
                                <Textarea
                                    value={formData.note}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, note: e.target.value })}
                                    placeholder="รายละเอียดเพิ่มเติม"
                                />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button variant="outline" className="flex-1" onClick={() => setIsAddDialogOpen(false)}>
                                    ยกเลิก
                                </Button>
                                <Button className="flex-1" onClick={handleSubmit} disabled={!formData.name}>
                                    {editingItem ? "บันทึก" : "เพิ่ม"}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {CATEGORIES.map(cat => {
                    const stat = stats.find(s => s.category === cat.value);
                    const Icon = cat.icon;
                    return (
                        <Card
                            key={cat.value}
                            className={`cursor-pointer transition hover:shadow-md ${selectedCategory === cat.value ? 'ring-2 ring-farm-green-500' : ''}`}
                            onClick={() => setSelectedCategory(selectedCategory === cat.value ? null : cat.value)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cat.color}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">{cat.label}</p>
                                        <p className="text-xl font-bold">{stat?.count || 0}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Search */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        className="pl-10"
                        placeholder="ค้นหาสินค้า/วัสดุ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Items List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        รายการ {selectedCategory ? `(${selectedCategory})` : ""} ({filteredItems.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-8">
                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 mb-4">ยังไม่มีสินค้า/วัสดุ</p>
                            <Button onClick={() => setIsAddDialogOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                เพิ่มสินค้า/วัสดุ
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredItems.map((item) => {
                                const catInfo = getCategoryInfo(item.category);
                                const Icon = catInfo.icon;
                                return (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-4 p-4 border rounded-xl hover:border-farm-green-300 transition"
                                    >
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${catInfo.color}`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-900">{item.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                {item.brand && <span>{item.brand}</span>}
                                                {item.type && <span>• {item.type}</span>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg">
                                                {item.quantity} {item.unit}
                                            </p>
                                            {item.price !== undefined && item.price > 0 && (
                                                <p className="text-sm text-gray-500">
                                                    ฿{item.price.toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEditDialog(item)}>
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    แก้ไข
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    ลบ
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
