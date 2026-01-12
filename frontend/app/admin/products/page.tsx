"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, Loader2, Plus, Edit, Trash2, X, Search, Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Product {
    id: string;
    name: string;
    price: number | null;
    description: string | null;
    imageUrl: string | null;
    category: { id: string; name: string } | null;
    brand: { id: string; name: string } | null;
    type: { id: string; name: string } | null;
}

interface Category {
    id: string;
    name: string;
}

interface ProductType {
    id: string;
    name: string;
    category: { id: string; name: string };
}

interface Brand {
    id: string;
    name: string;
}

export default function AdminProductsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [productTypes, setProductTypes] = useState<ProductType[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        description: "",
        imageUrl: "",
        categoryId: "",
        typeId: "",
        brandId: "",
    });

    const fetchProducts = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('adminToken');
            const params = new URLSearchParams({ page: page.toString(), limit: '12' });
            if (search) params.append('search', search);

            const res = await fetch(`${API_URL}/admin/products?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setProducts(data.items || []);
                setTotalPages(data.totalPages || 1);
                setTotal(data.total || 0);
            }
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setIsLoading(false);
        }
    }, [page, search]);

    const fetchMasterData = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        fetchProducts();
        fetchMasterData();
    }, [fetchProducts, fetchMasterData]);

    // Filter types by selected category
    const filteredTypes = formData.categoryId
        ? productTypes.filter(t => t.category.id === formData.categoryId)
        : productTypes;

    const openModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                price: product.price?.toString() || "",
                description: product.description || "",
                imageUrl: product.imageUrl || "",
                categoryId: product.category?.id || "",
                typeId: product.type?.id || "",
                brandId: product.brand?.id || "",
            });
        } else {
            setEditingProduct(null);
            setFormData({ name: "", price: "", description: "", imageUrl: "", categoryId: "", typeId: "", brandId: "" });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return;
        setIsSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const method = editingProduct ? 'PATCH' : 'POST';
            const url = editingProduct
                ? `${API_URL}/admin/products/${editingProduct.id}`
                : `${API_URL}/admin/products`;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const body: any = {
                name: formData.name,
                price: formData.price ? parseFloat(formData.price) : null,
                description: formData.description || null,
                imageUrl: formData.imageUrl || null,
            };
            if (formData.categoryId) body.categoryId = formData.categoryId;
            if (formData.typeId) body.typeId = formData.typeId;
            if (formData.brandId) body.brandId = formData.brandId;

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
                fetchProducts();
            }
        } catch (err) {
            console.error('Save failed:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบสินค้านี้?')) return;
        const token = localStorage.getItem('adminToken');
        await fetch(`${API_URL}/admin/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        fetchProducts();
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchProducts();
    };

    if (isLoading && products.length === 0) {
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
                    <h1 className="text-2xl font-bold text-gray-900">จัดการสินค้า</h1>
                    <p className="text-gray-500">สินค้า/วัสดุการเกษตร ({total} รายการ)</p>
                </div>
                <Button onClick={() => openModal()}>
                    <Plus className="w-4 h-4 mr-2" />
                    เพิ่มสินค้า
                </Button>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="ค้นหาชื่อสินค้า..."
                                className="pl-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Button type="submit" variant="outline">ค้นหา</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                    <Card key={product.id} className="overflow-hidden">
                        <CardContent className="p-0">
                            {/* Product Image */}
                            <div className="h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
                                {product.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Package className="w-12 h-12 text-gray-300" />
                                )}
                            </div>
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-medium text-gray-900 line-clamp-2">{product.name}</h3>
                                    <div className="flex gap-1 flex-shrink-0">
                                        <Button variant="ghost" size="sm" onClick={() => openModal(product)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                                {product.price && (
                                    <p className="text-lg font-bold text-green-600 mb-2">{formatCurrency(product.price)}</p>
                                )}
                                <div className="flex flex-wrap gap-1">
                                    {product.category && (
                                        <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700">
                                            {product.category.name}
                                        </span>
                                    )}
                                    {product.type && (
                                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                            {product.type.name}
                                        </span>
                                    )}
                                    {product.brand && (
                                        <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                                            {product.brand.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {products.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>ยังไม่มีสินค้า</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">หน้า {page} จาก {totalPages}</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                            ก่อนหน้า
                        </Button>
                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                            ถัดไป
                        </Button>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">{editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}</h3>
                            <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label>ชื่อสินค้า *</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="เช่น ปุ๋ยยูเรีย 46-0-0"
                                />
                            </div>

                            {/* Image URL */}
                            <div>
                                <Label className="flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" />
                                    รูปสินค้า (URL)
                                </Label>
                                <Input
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                />
                                {formData.imageUrl && (
                                    <div className="mt-2 h-24 bg-gray-100 rounded overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label>ราคา (บาท)</Label>
                                <Input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="เช่น 850"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>หมวดหมู่</Label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value, typeId: "" })}
                                    >
                                        <option value="">-- หมวดหมู่ --</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label>ประเภท</Label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.typeId}
                                        onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
                                        disabled={!formData.categoryId && filteredTypes.length === 0}
                                    >
                                        <option value="">-- ประเภท --</option>
                                        {filteredTypes.map((t) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <Label>แบรนด์</Label>
                                <select
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.brandId}
                                    onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                                >
                                    <option value="">-- เลือกแบรนด์ --</option>
                                    {brands.map((brand) => (
                                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label>รายละเอียด</Label>
                                <textarea
                                    className="w-full p-2 border rounded-lg h-20"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="รายละเอียดสินค้า..."
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
