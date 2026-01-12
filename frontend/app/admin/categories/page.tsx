"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, Factory, Loader2, Plus, Edit, Trash2, X, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ProductCategory {
    id: string;
    name: string;
    productCount: number;
    typeCount: number;
}

interface ProductType {
    id: string;
    name: string;
    category: { id: string; name: string };
    productCount: number;
}

interface ProductBrand {
    id: string;
    name: string;
    productCount: number;
}

type TabType = 'categories' | 'types' | 'brands';
type ModalType = 'category' | 'type' | 'brand';

export default function AdminCategoriesPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [productTypes, setProductTypes] = useState<ProductType[]>([]);
    const [brands, setBrands] = useState<ProductBrand[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('categories');

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<ModalType>('category');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    const [itemName, setItemName] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('adminToken');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [catRes, typeRes, brandRes] = await Promise.all([
                fetch(`${API_URL}/admin/product-categories`, { headers }),
                fetch(`${API_URL}/admin/product-types`, { headers }),
                fetch(`${API_URL}/admin/product-brands`, { headers }),
            ]);

            if (catRes.ok) setCategories(await catRes.json());
            if (typeRes.ok) setProductTypes(await typeRes.json());
            if (brandRes.ok) setBrands(await brandRes.json());
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const openModal = (type: ModalType, item?: any) => {
        setModalType(type);
        setEditingItem(item || null);
        setItemName(item?.name || "");
        setSelectedCategoryId(item?.category?.id || "");
        setShowModal(true);
    };

    const getModalTitle = () => {
        const prefix = editingItem ? 'แก้ไข' : 'เพิ่ม';
        switch (modalType) {
            case 'category': return `${prefix}หมวดหมู่`;
            case 'type': return `${prefix}ประเภท`;
            case 'brand': return `${prefix}แบรนด์`;
        }
    };

    const handleSave = async () => {
        if (!itemName.trim()) return;
        if (modalType === 'type' && !selectedCategoryId) {
            alert('กรุณาเลือกหมวดหมู่');
            return;
        }
        setIsSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            let endpoint = '';
            switch (modalType) {
                case 'category': endpoint = 'product-categories'; break;
                case 'type': endpoint = 'product-types'; break;
                case 'brand': endpoint = 'product-brands'; break;
            }

            const method = editingItem ? 'PATCH' : 'POST';
            const url = editingItem
                ? `${API_URL}/admin/${endpoint}/${editingItem.id}`
                : `${API_URL}/admin/${endpoint}`;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const body: any = { name: itemName };
            if (modalType === 'type') {
                body.categoryId = selectedCategoryId;
            }

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setShowModal(false);
                setItemName("");
                setSelectedCategoryId("");
                setEditingItem(null);
                fetchData();
            }
        } catch (err) {
            console.error('Save failed:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (type: ModalType, id: string) => {
        const labels = { category: 'หมวดหมู่', type: 'ประเภท', brand: 'แบรนด์' };
        if (!confirm(`ต้องการลบ${labels[type]}นี้?`)) return;
        const token = localStorage.getItem('adminToken');
        const endpoints = { category: 'product-categories', type: 'product-types', brand: 'product-brands' };
        await fetch(`${API_URL}/admin/${endpoints[type]}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        fetchData();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">จัดการหมวดหมู่</h1>
                    <p className="text-gray-500">หมวดหมู่ ประเภท และแบรนด์สินค้า</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b pb-2">
                <Button
                    variant={activeTab === 'categories' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('categories')}
                    className="gap-2"
                >
                    <Package className="w-4 h-4" />
                    หมวดหมู่ ({categories.length})
                </Button>
                <Button
                    variant={activeTab === 'types' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('types')}
                    className="gap-2"
                >
                    <Layers className="w-4 h-4" />
                    ประเภท ({productTypes.length})
                </Button>
                <Button
                    variant={activeTab === 'brands' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('brands')}
                    className="gap-2"
                >
                    <Factory className="w-4 h-4" />
                    แบรนด์ ({brands.length})
                </Button>
            </div>

            {/* Categories */}
            {activeTab === 'categories' && (
                <div>
                    <div className="flex justify-end mb-4">
                        <Button onClick={() => openModal('category')}>
                            <Plus className="w-4 h-4 mr-2" />
                            เพิ่มหมวดหมู่
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.map((cat) => (
                            <Card key={cat.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                                <Package className="w-5 h-5 text-orange-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{cat.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {cat.typeCount || 0} ประเภท · {cat.productCount} สินค้า
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => openModal('category', cat)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete('category', cat.id)}>
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {categories.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>ยังไม่มีหมวดหมู่สินค้า</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Product Types */}
            {activeTab === 'types' && (
                <div>
                    <div className="flex justify-end mb-4">
                        <Button onClick={() => openModal('type')}>
                            <Plus className="w-4 h-4 mr-2" />
                            เพิ่มประเภท
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {productTypes.map((pt) => (
                            <Card key={pt.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <Layers className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{pt.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700">
                                                        {pt.category.name}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        {pt.productCount} สินค้า
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => openModal('type', pt)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete('type', pt.id)}>
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {productTypes.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>ยังไม่มีประเภทสินค้า</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Brands */}
            {activeTab === 'brands' && (
                <div>
                    <div className="flex justify-end mb-4">
                        <Button onClick={() => openModal('brand')}>
                            <Plus className="w-4 h-4 mr-2" />
                            เพิ่มแบรนด์
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {brands.map((brand) => (
                            <Card key={brand.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                                <Factory className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{brand.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {brand.productCount} สินค้า
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => openModal('brand', brand)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete('brand', brand.id)}>
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {brands.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                <Factory className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>ยังไม่มีแบรนด์</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">{getModalTitle()}</h3>
                            <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4">
                            {/* Category selector for Type */}
                            {modalType === 'type' && (
                                <div>
                                    <Label>หมวดหมู่ *</Label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={selectedCategoryId}
                                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                                    >
                                        <option value="">-- เลือกหมวดหมู่ --</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <Label>ชื่อ{modalType === 'category' ? 'หมวดหมู่' : modalType === 'type' ? 'ประเภท' : 'แบรนด์'} *</Label>
                                <Input
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                    placeholder={
                                        modalType === 'category' ? 'เช่น ปุ๋ย, เมล็ดพันธุ์' :
                                            modalType === 'type' ? 'เช่น ปุ๋ยเคมี, ปุ๋ยอินทรีย์' :
                                                'เช่น ตราหมี, เจียไต๋'
                                    }
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setShowModal(false)}>ยกเลิก</Button>
                                <Button onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'บันทึก'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
