"use client";

import { useState, useEffect } from "react";
import {
    Flag,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    ToggleLeft,
    ToggleRight,
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

interface FeatureFlag {
    key: string;
    enabled: boolean;
    rollout?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: any;
    updatedAt: string;
}

export default function FeatureFlagsPage() {
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<FeatureFlag | null>(null);

    const [formData, setFormData] = useState({
        key: "",
        enabled: false,
        rollout: 100,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("adminToken");
            if (!token) return;

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
            const res = await fetch(`${apiUrl}/admin/feature-flags`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setFlags(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem("adminToken");
            if (!token) return;

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
            const method = editingItem ? "PATCH" : "POST";
            const url = editingItem
                ? `${apiUrl}/admin/feature-flags/${editingItem.key}`
                : `${apiUrl}/admin/feature-flags`;

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

    const handleToggle = async (flag: FeatureFlag) => {
        try {
            const token = localStorage.getItem("adminToken");
            if (!token) return;

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
            const res = await fetch(`${apiUrl}/admin/feature-flags/${flag.key}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ enabled: !flag.enabled }),
            });

            if (res.ok) fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (key: string) => {
        if (!confirm("ยืนยันการลบ Feature Flag นี้?")) return;

        try {
            const token = localStorage.getItem("adminToken");
            if (!token) return;

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
            const res = await fetch(`${apiUrl}/admin/feature-flags/${key}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const resetForm = () => {
        setFormData({ key: "", enabled: false, rollout: 100 });
    };

    const openEditDialog = (flag: FeatureFlag) => {
        setEditingItem(flag);
        setFormData({
            key: flag.key,
            enabled: flag.enabled,
            rollout: flag.rollout || 100,
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
                    <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
                    <p className="text-gray-500">เปิด/ปิดฟีเจอร์ของระบบ</p>
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
                            เพิ่ม Flag
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingItem ? "แก้ไข Feature Flag" : "เพิ่ม Feature Flag ใหม่"}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Key *</Label>
                                <Input
                                    value={formData.key}
                                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                                    placeholder="เช่น new_dashboard, ai_chat"
                                    disabled={!!editingItem}
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <Label>สถานะ</Label>
                                    <div className="flex items-center gap-2 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                                            className={`w-12 h-6 rounded-full transition ${formData.enabled ? "bg-green-500" : "bg-gray-300"}`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition ${formData.enabled ? "translate-x-6" : "translate-x-1"}`} />
                                        </button>
                                        <span>{formData.enabled ? "เปิด" : "ปิด"}</span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <Label>Rollout %</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.rollout}
                                        onChange={(e) => setFormData({ ...formData, rollout: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                                    ยกเลิก
                                </Button>
                                <Button className="flex-1" onClick={handleSubmit} disabled={!formData.key}>
                                    {editingItem ? "บันทึก" : "เพิ่ม"}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Flags List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Flag className="w-5 h-5" />
                        Feature Flags ({flags.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {flags.length === 0 ? (
                        <div className="text-center py-8">
                            <Flag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">ยังไม่มี Feature Flag</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {flags.map((flag) => (
                                <div
                                    key={flag.key}
                                    className="flex items-center gap-4 p-4 border rounded-lg hover:border-farm-green-300 transition"
                                >
                                    <button
                                        onClick={() => handleToggle(flag)}
                                        className="flex-shrink-0"
                                    >
                                        {flag.enabled ? (
                                            <ToggleRight className="w-10 h-10 text-green-500" />
                                        ) : (
                                            <ToggleLeft className="w-10 h-10 text-gray-400" />
                                        )}
                                    </button>
                                    <div className="flex-1">
                                        <h3 className="font-mono font-medium">{flag.key}</h3>
                                        <div className="flex items-center gap-3 text-sm text-gray-500">
                                            <span className={`px-2 py-0.5 rounded ${flag.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                                {flag.enabled ? "เปิด" : "ปิด"}
                                            </span>
                                            {flag.rollout !== undefined && flag.rollout < 100 && (
                                                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                                    {flag.rollout}% rollout
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {new Date(flag.updatedAt).toLocaleDateString("th-TH")}
                                    </div>
                                    <div className="flex gap-1">
                                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(flag)}>
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(flag.key)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
