"use client";

import { useState, useEffect, useCallback } from "react";
import { Sprout, Loader2, Plus, Edit, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface CropVariety {
    id: string;
    name: string;
    duration: number | null;
}

interface CropType {
    id: string;
    name: string;
    varietyCount: number;
    varieties: CropVariety[];
}

export default function AdminCropsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [cropTypes, setCropTypes] = useState<CropType[]>([]);
    const [expandedType, setExpandedType] = useState<string | null>(null);

    // Modal states
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [showVarietyModal, setShowVarietyModal] = useState(false);
    const [editingType, setEditingType] = useState<CropType | null>(null);
    const [editingVariety, setEditingVariety] = useState<CropVariety | null>(null);
    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);

    // Form states
    const [typeName, setTypeName] = useState("");
    const [varietyName, setVarietyName] = useState("");
    const [varietyDuration, setVarietyDuration] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const fetchCropTypes = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/crop-types`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) setCropTypes(await res.json());
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCropTypes();
    }, [fetchCropTypes]);

    const handleSaveType = async () => {
        if (!typeName.trim()) return;
        setIsSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const method = editingType ? 'PATCH' : 'POST';
            const url = editingType
                ? `${API_URL}/admin/crop-types/${editingType.id}`
                : `${API_URL}/admin/crop-types`;

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: typeName }),
            });

            if (res.ok) {
                setShowTypeModal(false);
                setTypeName("");
                setEditingType(null);
                fetchCropTypes();
            }
        } catch (err) {
            console.error('Save failed:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveVariety = async () => {
        if (!varietyName.trim() || !selectedTypeId) return;
        setIsSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const method = editingVariety ? 'PATCH' : 'POST';
            const url = editingVariety
                ? `${API_URL}/admin/crop-varieties/${editingVariety.id}`
                : `${API_URL}/admin/crop-varieties`;

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: varietyName,
                    duration: varietyDuration ? parseInt(varietyDuration) : null,
                    cropTypeId: selectedTypeId,
                }),
            });

            if (res.ok) {
                setShowVarietyModal(false);
                setVarietyName("");
                setVarietyDuration("");
                setEditingVariety(null);
                fetchCropTypes();
            }
        } catch (err) {
            console.error('Save failed:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteType = async (id: string) => {
        if (!confirm('ต้องการลบประเภทพืชนี้?')) return;
        const token = localStorage.getItem('adminToken');
        await fetch(`${API_URL}/admin/crop-types/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        fetchCropTypes();
    };

    const handleDeleteVariety = async (id: string) => {
        if (!confirm('ต้องการลบพันธุ์นี้?')) return;
        const token = localStorage.getItem('adminToken');
        await fetch(`${API_URL}/admin/crop-varieties/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        fetchCropTypes();
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
                    <h1 className="text-2xl font-bold text-gray-900">จัดการพืช</h1>
                    <p className="text-gray-500">ประเภทพืชและพันธุ์พืช</p>
                </div>
                <Button onClick={() => { setEditingType(null); setTypeName(""); setShowTypeModal(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    เพิ่มประเภทพืช
                </Button>
            </div>

            {/* Crop Types List */}
            <div className="space-y-4">
                {cropTypes.map((ct) => (
                    <Card key={ct.id}>
                        <CardHeader className="cursor-pointer" onClick={() => setExpandedType(expandedType === ct.id ? null : ct.id)}>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Sprout className="w-5 h-5 text-green-600" />
                                    {ct.name}
                                    <span className="text-sm font-normal text-gray-400">({ct.varietyCount} พันธุ์)</span>
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingType(ct); setTypeName(ct.name); setShowTypeModal(true); }}>
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteType(ct.id); }}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                    {expandedType === ct.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                            </div>
                        </CardHeader>
                        {expandedType === ct.id && (
                            <CardContent className="pt-0">
                                <div className="border-t pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-gray-700">พันธุ์พืช</h4>
                                        <Button size="sm" variant="outline" onClick={() => { setSelectedTypeId(ct.id); setEditingVariety(null); setVarietyName(""); setVarietyDuration(""); setShowVarietyModal(true); }}>
                                            <Plus className="w-3 h-3 mr-1" />
                                            เพิ่มพันธุ์
                                        </Button>
                                    </div>
                                    {ct.varieties.length === 0 ? (
                                        <p className="text-sm text-gray-400">ยังไม่มีพันธุ์พืช</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {ct.varieties.map((v) => (
                                                <div key={v.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                    <div>
                                                        <span className="text-sm font-medium">{v.name}</span>
                                                        {v.duration && <span className="text-xs text-gray-400 ml-2">({v.duration} วัน)</span>}
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="sm" onClick={() => { setSelectedTypeId(ct.id); setEditingVariety(v); setVarietyName(v.name); setVarietyDuration(v.duration?.toString() || ""); setShowVarietyModal(true); }}>
                                                            <Edit className="w-3 h-3" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteVariety(v.id)}>
                                                            <Trash2 className="w-3 h-3 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        )}
                    </Card>
                ))}
                {cropTypes.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Sprout className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>ยังไม่มีประเภทพืช</p>
                    </div>
                )}
            </div>

            {/* Modal: Add/Edit Crop Type */}
            {showTypeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">{editingType ? 'แก้ไขประเภทพืช' : 'เพิ่มประเภทพืช'}</h3>
                            <button onClick={() => setShowTypeModal(false)}><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label>ชื่อประเภทพืช</Label>
                                <Input value={typeName} onChange={(e) => setTypeName(e.target.value)} placeholder="เช่น ข้าว, มันสำปะหลัง" />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setShowTypeModal(false)}>ยกเลิก</Button>
                                <Button onClick={handleSaveType} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'บันทึก'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Add/Edit Variety */}
            {showVarietyModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">{editingVariety ? 'แก้ไขพันธุ์' : 'เพิ่มพันธุ์'}</h3>
                            <button onClick={() => setShowVarietyModal(false)}><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label>ชื่อพันธุ์</Label>
                                <Input value={varietyName} onChange={(e) => setVarietyName(e.target.value)} placeholder="เช่น ข้าวขาวดอกมะลิ 105" />
                            </div>
                            <div>
                                <Label>ระยะเวลาเก็บเกี่ยว (วัน)</Label>
                                <Input type="number" value={varietyDuration} onChange={(e) => setVarietyDuration(e.target.value)} placeholder="เช่น 120" />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setShowVarietyModal(false)}>ยกเลิก</Button>
                                <Button onClick={handleSaveVariety} disabled={isSaving}>
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
