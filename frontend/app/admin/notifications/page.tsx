"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Send, Loader2, Users, Filter, Plus, Trash2, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRelativeTime } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
    target: 'ALL' | 'SPECIFIC';
    targetCount: number;
    sentAt: string;
    readCount: number;
    totalSent: number;
}

const NOTIFICATION_TYPES = [
    { value: 'INFO', label: 'ข้อมูล', color: 'bg-blue-100 text-blue-700' },
    { value: 'WARNING', label: 'คำเตือน', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'SUCCESS', label: 'สำเร็จ', color: 'bg-green-100 text-green-700' },
    { value: 'ERROR', label: 'ข้อผิดพลาด', color: 'bg-red-100 text-red-700' },
];

export default function AdminNotificationsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [users, setUsers] = useState<{ id: string; displayName: string }[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'INFO' as 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR',
        target: 'ALL' as 'ALL' | 'SPECIFIC',
        targetUserIds: [] as string[],
    });

    const fetchNotifications = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                setNotifications(await res.json());
            }
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/users?limit=100`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        fetchUsers();
    }, [fetchNotifications, fetchUsers]);

    const handleSend = async () => {
        if (!formData.title || !formData.message) {
            alert('กรุณากรอกหัวข้อและข้อความ');
            return;
        }

        try {
            setIsSending(true);
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/notifications`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                alert('ส่งแจ้งเตือนสำเร็จ!');
                setShowModal(false);
                setFormData({ title: '', message: '', type: 'INFO', target: 'ALL', targetUserIds: [] });
                fetchNotifications();
            } else {
                alert('เกิดข้อผิดพลาด');
            }
        } catch (err) {
            console.error('Failed to send:', err);
        } finally {
            setIsSending(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบการแจ้งเตือนนี้?')) return;

        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${API_URL}/admin/notifications/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            fetchNotifications();
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };

    const getTypeBadge = (type: string) => {
        return NOTIFICATION_TYPES.find(t => t.value === type) || NOTIFICATION_TYPES[0];
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
                    <h1 className="text-2xl font-bold text-gray-900">ศูนย์แจ้งเตือน</h1>
                    <p className="text-gray-500">ส่งการแจ้งเตือนถึงผู้ใช้</p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    ส่งแจ้งเตือนใหม่
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Bell className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{notifications.length}</p>
                                <p className="text-sm text-gray-500">แจ้งเตือนทั้งหมด</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <Send className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{notifications.reduce((sum, n) => sum + n.totalSent, 0)}</p>
                                <p className="text-sm text-gray-500">ส่งแล้วทั้งหมด</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{notifications.reduce((sum, n) => sum + n.readCount, 0)}</p>
                                <p className="text-sm text-gray-500">อ่านแล้ว</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Notifications List */}
            <Card>
                <CardHeader>
                    <CardTitle>ประวัติการแจ้งเตือน</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {notifications.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>ยังไม่มีการแจ้งเตือน</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notif) => {
                                const typeBadge = getTypeBadge(notif.type);
                                return (
                                    <div key={notif.id} className="p-4 hover:bg-gray-50 flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeBadge.color}`}>
                                                    {typeBadge.label}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {notif.target === 'ALL' ? 'ทุกคน' : `${notif.targetCount || 0} คน`}
                                                </span>
                                            </div>
                                            <p className="font-medium text-gray-900">{notif.title}</p>
                                            <p className="text-sm text-gray-600 line-clamp-2">{notif.message}</p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                                <span>ส่ง {notif.totalSent} คน</span>
                                                <span>อ่าน {notif.readCount} คน</span>
                                                <span>{formatRelativeTime(notif.sentAt)}</span>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(notif.id)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Send Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-lg">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-bold text-lg">ส่งแจ้งเตือนใหม่</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="space-y-2">
                                <Label>หัวข้อ *</Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="หัวข้อการแจ้งเตือน"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>ข้อความ *</Label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="รายละเอียดการแจ้งเตือน..."
                                    className="w-full border rounded-lg p-3 h-24 resize-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>ประเภท</Label>
                                <div className="flex gap-2">
                                    {NOTIFICATION_TYPES.map(type => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            onClick={() => setFormData({ ...formData, type: type.value as any })}
                                            className={`px-3 py-1.5 rounded text-sm ${formData.type === type.value ? type.color : 'bg-gray-100 text-gray-600'}`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>ส่งถึง</Label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, target: 'ALL' })}
                                        className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 ${formData.target === 'ALL' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}
                                    >
                                        <Users className="w-4 h-4" /> ทุกคน
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, target: 'SPECIFIC' })}
                                        className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 ${formData.target === 'SPECIFIC' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}
                                    >
                                        <Filter className="w-4 h-4" /> เลือกผู้ใช้
                                    </button>
                                </div>
                            </div>
                            {formData.target === 'SPECIFIC' && (
                                <div className="space-y-2">
                                    <Label>เลือกผู้ใช้</Label>
                                    <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                                        {users.map(user => (
                                            <label key={user.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.targetUserIds.includes(user.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData({ ...formData, targetUserIds: [...formData.targetUserIds, user.id] });
                                                        } else {
                                                            setFormData({ ...formData, targetUserIds: formData.targetUserIds.filter(id => id !== user.id) });
                                                        }
                                                    }}
                                                    className="w-4 h-4 rounded"
                                                />
                                                <span className="text-sm">{user.displayName || user.id}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500">เลือกแล้ว {formData.targetUserIds.length} คน</p>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2 p-4 border-t">
                            <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>ยกเลิก</Button>
                            <Button className="flex-1" onClick={handleSend} disabled={isSending}>
                                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> ส่ง</>}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
