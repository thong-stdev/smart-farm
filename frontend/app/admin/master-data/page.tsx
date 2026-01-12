"use client";

import { useState, useEffect } from "react";
import { Loader2, Sprout, Package, Factory } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface CropType {
    id: string;
    name: string;
    varietyCount: number;
    varieties: { id: string; name: string; duration: number | null }[];
}

interface ProductCategory {
    id: string;
    name: string;
    productCount: number;
    typeCount: number;
}

interface ProductBrand {
    id: string;
    name: string;
    productCount: number;
}

export default function AdminMasterDataPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [cropTypes, setCropTypes] = useState<CropType[]>([]);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [brands, setBrands] = useState<ProductBrand[]>([]);
    const [activeTab, setActiveTab] = useState<'crops' | 'categories' | 'brands'>('crops');

    useEffect(() => {
        fetchMasterData();
    }, []);

    const fetchMasterData = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('adminToken');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [cropRes, catRes, brandRes] = await Promise.all([
                fetch(`${API_URL}/admin/crop-types`, { headers }),
                fetch(`${API_URL}/admin/product-categories`, { headers }),
                fetch(`${API_URL}/admin/product-brands`, { headers }),
            ]);

            if (cropRes.ok) setCropTypes(await cropRes.json());
            if (catRes.ok) setCategories(await catRes.json());
            if (brandRes.ok) setBrands(await brandRes.json());
        } catch (err) {
            console.error('Failed to fetch master data:', err);
        } finally {
            setIsLoading(false);
        }
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
                    <h1 className="text-2xl font-bold text-gray-900">Master Data</h1>
                    <p className="text-gray-500">จัดการข้อมูลพื้นฐานของระบบ</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b pb-2">
                <Button
                    variant={activeTab === 'crops' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('crops')}
                    className="gap-2"
                >
                    <Sprout className="w-4 h-4" />
                    พันธุ์พืช ({cropTypes.length})
                </Button>
                <Button
                    variant={activeTab === 'categories' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('categories')}
                    className="gap-2"
                >
                    <Package className="w-4 h-4" />
                    หมวดหมู่สินค้า ({categories.length})
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

            {/* Crop Types */}
            {activeTab === 'crops' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cropTypes.map((ct) => (
                        <Card key={ct.id}>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Sprout className="w-5 h-5 text-green-600" />
                                    {ct.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500 mb-3">
                                    {ct.varietyCount} พันธุ์
                                </p>
                                <div className="space-y-1">
                                    {ct.varieties.slice(0, 5).map((v) => (
                                        <div key={v.id} className="flex justify-between text-sm">
                                            <span className="text-gray-700">{v.name}</span>
                                            {v.duration && (
                                                <span className="text-gray-400">{v.duration} วัน</span>
                                            )}
                                        </div>
                                    ))}
                                    {ct.varieties.length > 5 && (
                                        <p className="text-xs text-gray-400">+{ct.varieties.length - 5} พันธุ์</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {cropTypes.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            <Sprout className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>ยังไม่มีข้อมูลพันธุ์พืช</p>
                        </div>
                    )}
                </div>
            )}

            {/* Product Categories */}
            {activeTab === 'categories' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((cat) => (
                        <Card key={cat.id}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                        <Package className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{cat.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {cat.productCount} สินค้า • {cat.typeCount} ประเภท
                                        </p>
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
            )}

            {/* Brands */}
            {activeTab === 'brands' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {brands.map((brand) => (
                        <Card key={brand.id}>
                            <CardContent className="p-4">
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
                            </CardContent>
                        </Card>
                    ))}
                    {brands.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            <Factory className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>ยังไม่มีแบรนด์สินค้า</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
