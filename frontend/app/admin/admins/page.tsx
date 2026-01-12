"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, Edit, Trash2, X, Shield, CheckCircle, Ban } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRelativeTime } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Admin {
    id: string;
    username: string;
    email: string | null;
    name: string | null;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
    isActive: boolean;
    createdAt: string;
    lastLoginAt: string | null;
}

const ROLES = [
    { value: 'SUPER_ADMIN', label: 'Super Admin', color: 'bg-red-100 text-red-700' },
    { value: 'ADMIN', label: 'Admin', color: 'bg-blue-100 text-blue-700' },
    { value: 'STAFF', label: 'Staff', color: 'bg-gray-100 text-gray-700' },
];

export default function AdminManagementPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        name: '',
        password: '',
        role: 'ADMIN' as 'SUPER_ADMIN' | 'ADMIN' | 'STAFF',
    });
    const [isSaving, setIsSaving] = useState(false);

    const fetchAdmins = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/admins`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                setAdmins(await res.json());
            }
        } catch (err) {
            console.error('Failed to fetch admins:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAdmins();
    }, [fetchAdmins]);

    const openModal = (admin?: Admin) => {
        if (admin) {
            setEditingAdmin(admin);
            setFormData({
                username: admin.username,
                email: admin.email || '',
                name: admin.name || '',
                password: '',
                role: admin.role,
            });
        } else {
            setEditingAdmin(null);
            setFormData({ username: '', email: '', name: '', password: '', role: 'ADMIN' });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const token = localStorage.getItem('adminToken');
            const url = editingAdmin
                ? `${API_URL}/admin/admins/${editingAdmin.id}`
                : `${API_URL}/admin/admins`;

            const body: {
                name: string | null;
                role: string;
                username?: string;
                email?: string | null;
                password?: string;
            } = {
                name: formData.name || null,
                role: formData.role,
            };

            if (!editingAdmin) {
                body.username = formData.username;
                body.email = formData.email || null;
                body.password = formData.password;
            } else {
                if (formData.email) body.email = formData.email;
                if (formData.password) body.password = formData.password;
            }

            const res = await fetch(url, {
                method: editingAdmin ? 'PATCH' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                fetchAdmins();
                setShowModal(false);
            } else {
                const err = await res.json();
                alert(err.message || 'เกิดข้อผิดพลาด');
            }
        } catch (err) {
            console.error('Failed to save:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleStatus = async (admin: Admin) => {
        if (!confirm(admin.isActive ? 'ต้องการระงับ Admin นี้?' : 'ต้องการเปิดใช้งาน Admin นี้?')) return;

        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/admins/${admin.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isActive: !admin.isActive }),
            });
            if (res.ok) {
                fetchAdmins();
            }
        } catch (err) {
            console.error('Failed to toggle status:', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบ Admin นี้?')) return;

        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/admins/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                fetchAdmins();
            }
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };

    const getRoleBadge = (role: string) => {
        return ROLES.find(r => r.value === role) || ROLES[2];
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
                    <h1 className="text-2xl font-bold text-gray-900">จัดการ Admin</h1>
                    <p className="text-gray-500">จัดการผู้ดูแลระบบ</p>
                </div>
                <Button onClick={() => openModal()}>
                    <Plus className="w-4 h-4 mr-2" />
                    เพิ่ม Admin
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {admins.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>ยังไม่มี Admin</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Admin</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">อีเมล</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">บทบาท</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">สถานะ</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Login ล่าสุด</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {admins.map((admin) => {
                                        const roleBadge = getRoleBadge(admin.role);
                                        return (
                                            <tr key={admin.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                            <Shield className="w-5 h-5 text-gray-500" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{admin.name || admin.username}</p>
                                                            <p className="text-xs text-gray-400">@{admin.username}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{admin.email || '-'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleBadge.color}`}>
                                                        {roleBadge.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${admin.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {admin.isActive ? 'ใช้งาน' : 'ระงับ'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500">
                                                    {admin.lastLoginAt ? formatRelativeTime(admin.lastLoginAt) : '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="sm" onClick={() => openModal(admin)}>
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleToggleStatus(admin)}
                                                        >
                                                            {admin.isActive ? (
                                                                <Ban className="w-4 h-4 text-orange-500" />
                                                            ) : (
                                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(admin.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-500" />
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-bold text-lg">{editingAdmin ? 'แก้ไข Admin' : 'เพิ่ม Admin ใหม่'}</h3>
                            <button onClick={() => setShowModal(false)}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="space-y-2">
                                <Label>Username *</Label>
                                <Input
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    disabled={!!editingAdmin}
                                    placeholder="admin_username"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>อีเมล (ไม่บังคับ)</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="admin@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>ชื่อ</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="ชื่อผู้ดูแล"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{editingAdmin ? 'รหัสผ่านใหม่ (ไม่บังคับ)' : 'รหัสผ่าน *'}</Label>
                                <Input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={editingAdmin ? 'ปล่อยว่างถ้าไม่เปลี่ยน' : 'รหัสผ่าน'}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>บทบาท</Label>
                                <div className="flex gap-2">
                                    {ROLES.map(role => (
                                        <button
                                            key={role.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, role: role.value as 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' })}
                                            className={`px-3 py-2 rounded border ${formData.role === role.value ? role.color + ' border-current' : 'bg-gray-50 border-gray-200'}`}
                                        >
                                            {role.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 p-4 border-t">
                            <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                                ยกเลิก
                            </Button>
                            <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'บันทึก'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
