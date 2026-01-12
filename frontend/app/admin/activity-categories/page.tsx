"use client";

import { useState, useEffect, useCallback } from "react";
import { Tag, Loader2, Plus, Edit, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ActivityCategory {
    id: string;
    name: string;
    type: string;
    icon: string | null;
}

const ACTIVITY_TYPES = [
    { value: 'INCOME', label: 'รายรับ', color: 'bg-green-100 text-green-700' },
    { value: 'EXPENSE', label: 'รายจ่าย', color: 'bg-red-100 text-red-700' },
    { value: 'PLANTING', label: 'การปลูก', color: 'bg-blue-100 text-blue-700' },
    { value: 'GENERAL', label: 'ทั่วไป', color: 'bg-gray-100 text-gray-700' },
];

export default function AdminActivityCategoriesPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState<ActivityCategory[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<ActivityCategory | null>(null);
    const [name, setName] = useState("");
    const [type, setType] = useState("GENERAL");
    const [icon, setIcon] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/activity-categories`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                setCategories(await res.json());
            }
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const openModal = (item?: ActivityCategory) => {
        setEditingItem(item || null);
        setName(item?.name || "");
        setType(item?.type || "GENERAL");
        setIcon(item?.icon || "");
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!name.trim()) return;
        setIsSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const method = editingItem ? 'PATCH' : 'POST';
            const url = editingItem
                ? `${API_URL}/admin/activity-categories/${editingItem.id}`
                : `${API_URL}/admin/activity-categories`;

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, type, icon: icon || null }),
            });

            if (res.ok) {
                setShowModal(false);
                setName("");
                setType("GENERAL");
                setIcon("");
                setEditingItem(null);
                fetchData();
            }
        } catch (err) {
            console.error('Save failed:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบหมวดหมู่กิจกรรมนี้?')) return;
        const token = localStorage.getItem('adminToken');
        await fetch(`${API_URL}/admin/activity-categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        fetchData();
    };

    const getTypeInfo = (typeValue: string) => {
        return ACTIVITY_TYPES.find(t => t.value === typeValue) || ACTIVITY_TYPES[3];
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
                    <h1 className="text-2xl font-bold text-gray-900">หมวดหมู่กิจกรรม</h1>
                    <p className="text-gray-500">จัดการหมวดหมู่สำหรับบันทึกกิจกรรม</p>
                </div>
                <Button onClick={() => openModal()} className="gap-2">
                    <Plus className="w-4 h-4" />
                    เพิ่มหมวดหมู่
                </Button>
            </div>

            {/* Stats by Type */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {ACTIVITY_TYPES.map(t => {
                    const count = categories.filter(c => c.type === t.value).length;
                    return (
                        <Card key={t.value}>
                            <CardContent className="p-4 text-center">
                                <p className="text-2xl font-bold">{count}</p>
                                <span className={`text-xs px-2 py-1 rounded-full ${t.color}`}>{t.label}</span>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => {
                    const typeInfo = getTypeInfo(cat.type);
                    return (
                        <Card key={cat.id}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center text-xl">
                                            {cat.icon || '📋'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{cat.name}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                                                {typeInfo.label}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => openModal(cat)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
                {categories.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>ยังไม่มีหมวดหมู่กิจกรรม</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">
                                {editingItem ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}
                            </h3>
                            <button onClick={() => setShowModal(false)}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label>ชื่อหมวดหมู่ *</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="เช่น ค่าแรง, ค่าปุ๋ย, ขายผลผลิต"
                                />
                            </div>
                            <div>
                                <Label>ประเภท *</Label>
                                <select
                                    className="w-full p-2 border rounded-lg"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                >
                                    {ACTIVITY_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label>ไอคอน (Emoji)</Label>
                                <Input
                                    value={icon}
                                    onChange={(e) => setIcon(e.target.value)}
                                    placeholder="เช่น 💰 🌾 🚜"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setShowModal(false)}>
                                    ยกเลิก
                                </Button>
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
