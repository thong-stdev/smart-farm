"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Search, Loader2, Eye, Sprout, ClipboardList, Download, X, Ban, CheckCircle, Trash2, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatRelativeTime, formatNumber } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface User {
    id: string;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
    pictureUrl: string | null;
    email?: string | null;
    providers: { provider: string; email?: string | null }[];
    plotCount: number;
    activityCount: number;
    status?: 'ACTIVE' | 'SUSPENDED';
    createdAt: string;
}

interface UserDetail {
    id: string;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
    pictureUrl: string | null;
    email?: string | null;
    status?: 'ACTIVE' | 'SUSPENDED';
    providers: { provider: string; email?: string | null }[];
    plots: { id: string; name: string; size: number; status: string }[];
    plotCount?: number;
    activityCount?: number;
    totalIncome?: number;
    totalExpense?: number;
    createdAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function AdminUsersPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('adminToken');
            const params = new URLSearchParams({ page: page.toString(), limit: '10' });
            if (search) params.append('search', search);

            const res = await fetch(`${API_URL}/admin/users?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setUsers(data.items || []);
                setPagination({
                    page: data.page || 1,
                    limit: data.limit || 10,
                    total: data.total || 0,
                    totalPages: data.totalPages || 1,
                });
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setIsLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchUsers();
    };

    const fetchUserDetail = async (userId: string) => {
        try {
            setIsLoadingDetail(true);
            setShowDetailModal(true);
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                setSelectedUser(await res.json());
            }
        } catch (err) {
            console.error('Failed to fetch user detail:', err);
        } finally {
            setIsLoadingDetail(false);
        }
    };

    const handleStatusChange = async (userId: string, newStatus: 'ACTIVE' | 'SUSPENDED') => {
        if (!confirm(newStatus === 'SUSPENDED' ? 'ต้องการระงับผู้ใช้นี้?' : 'ต้องการเปิดใช้งานผู้ใช้นี้?')) return;

        setActionLoading(userId);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/users/${userId}/status`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                fetchUsers();
                if (selectedUser?.id === userId) {
                    setSelectedUser({ ...selectedUser, status: newStatus });
                }
            }
        } catch (err) {
            console.error('Failed to update status:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('ต้องการลบผู้ใช้นี้? (ผู้ใช้จะถูกระงับการใช้งาน)')) return;

        setActionLoading(userId);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                fetchUsers();
                setShowDetailModal(false);
            }
        } catch (err) {
            console.error('Failed to delete user:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleExport = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/users/export/csv`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const { data, filename } = await res.json();

                // Convert to CSV
                const headers = Object.keys(data[0] || {});
                const csvContent = [
                    headers.join(','),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ...data.map((row: any) => headers.map(h => `"${row[h] || ''}"`).join(','))
                ].join('\n');

                // Download
                const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('Failed to export:', err);
        }
    };

    const getProviderBadge = (provider: string) => {
        switch (provider) {
            case 'LINE': return 'bg-green-100 text-green-700';
            case 'GOOGLE': return 'bg-blue-100 text-blue-700';
            case 'EMAIL': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusBadge = (status: 'ACTIVE' | 'SUSPENDED') => {
        return status === 'ACTIVE'
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">จัดการผู้ใช้งาน</h1>
                    <p className="text-gray-500">
                        ทั้งหมด {pagination?.total || 0} ผู้ใช้
                    </p>
                </div>
                <Button onClick={handleExport} variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export CSV
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
                                placeholder="ค้นหาชื่อหรืออีเมล..."
                                className="pl-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Button type="submit" variant="outline">ค้นหา</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>ไม่พบผู้ใช้งาน</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ผู้ใช้</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">อีเมล</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Provider</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">สถานะ</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                                            <Sprout className="w-4 h-4 inline" />
                                        </th>
                                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                                            <ClipboardList className="w-4 h-4 inline" />
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">สมัครเมื่อ</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                        {user.pictureUrl ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={user.pictureUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Users className="w-5 h-5 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'ไม่ระบุชื่อ'}
                                                        </p>
                                                        <p className="text-xs text-gray-400">{user.id.substring(0, 8)}...</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {user.email || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                    {user.providers?.map((p, i) => (
                                                        <span key={i} className={`px-2 py-0.5 rounded text-xs font-medium ${getProviderBadge(p.provider)}`}>
                                                            {p.provider}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(user.status || 'ACTIVE')}`}>
                                                    {user.status === 'SUSPENDED' ? 'ระงับ' : 'ใช้งาน'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm text-gray-600">
                                                {user.plotCount}
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm text-gray-600">
                                                {user.activityCount}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {formatRelativeTime(user.createdAt)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="sm" onClick={() => fetchUserDetail(user.id)}>
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    {user.status === 'ACTIVE' ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleStatusChange(user.id, 'SUSPENDED')}
                                                            disabled={actionLoading === user.id}
                                                        >
                                                            <Ban className="w-4 h-4 text-orange-500" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                                                            disabled={actionLoading === user.id}
                                                        >
                                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t">
                            <p className="text-sm text-gray-500">
                                หน้า {pagination.page} จาก {pagination.totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                >
                                    ก่อนหน้า
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= pagination.totalPages}
                                    onClick={() => setPage(page + 1)}
                                >
                                    ถัดไป
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* User Detail Modal */}
            {showDetailModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {isLoadingDetail ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                            </div>
                        ) : selectedUser && (
                            <>
                                <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
                                    <h3 className="font-bold text-lg">รายละเอียดผู้ใช้</h3>
                                    <button onClick={() => setShowDetailModal(false)}>
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-4 space-y-6">
                                    {/* User Info */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                            {selectedUser.pictureUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={selectedUser.pictureUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Users className="w-8 h-8 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-xl">
                                                {selectedUser.displayName || `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || 'ไม่ระบุชื่อ'}
                                            </h4>
                                            <p className="text-gray-500">{selectedUser.email || 'ไม่มีอีเมล'}</p>
                                            <div className="flex gap-2 mt-1">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(selectedUser.status || 'ACTIVE')}`}>
                                                    {selectedUser.status === 'SUSPENDED' ? 'ระงับ' : 'ใช้งาน'}
                                                </span>
                                                {selectedUser.providers.map((p, i) => (
                                                    <span key={i} className={`px-2 py-0.5 rounded text-xs font-medium ${getProviderBadge(p.provider)}`}>
                                                        {p.provider}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                                            <p className="text-2xl font-bold text-blue-600">{selectedUser.plotCount || 0}</p>
                                            <p className="text-sm text-blue-600">แปลง</p>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-3 text-center">
                                            <p className="text-2xl font-bold text-green-600">{selectedUser.activityCount || 0}</p>
                                            <p className="text-sm text-green-600">กิจกรรม</p>
                                        </div>
                                    </div>

                                    {/* Income/Expense Summary */}
                                    {(selectedUser.totalIncome || selectedUser.totalExpense) && (
                                        <div>
                                            <h5 className="font-medium mb-2">สรุปการเงิน</h5>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-green-50 rounded p-2 flex justify-between">
                                                    <span className="text-sm text-gray-600">รายรับ</span>
                                                    <span className="font-medium text-green-600">฿{formatNumber(selectedUser.totalIncome || 0)}</span>
                                                </div>
                                                <div className="bg-red-50 rounded p-2 flex justify-between">
                                                    <span className="text-sm text-gray-600">รายจ่าย</span>
                                                    <span className="font-medium text-red-600">฿{formatNumber(selectedUser.totalExpense || 0)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Plots */}
                                    {selectedUser.plots.length > 0 && (
                                        <div>
                                            <h5 className="font-medium mb-2 flex items-center gap-2">
                                                <MapPin className="w-4 h-4" /> แปลงของผู้ใช้
                                            </h5>
                                            <div className="space-y-2">
                                                {selectedUser.plots.map(plot => (
                                                    <div key={plot.id} className="bg-gray-50 rounded p-3 flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium">{plot.name}</p>
                                                            <p className="text-sm text-gray-500">{plot.size} ไร่</p>
                                                        </div>
                                                        <span className={`px-2 py-0.5 rounded text-xs ${plot.status === 'NORMAL' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {plot.status}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-4 border-t">
                                        {selectedUser.status === 'ACTIVE' ? (
                                            <Button
                                                variant="outline"
                                                className="flex-1 text-orange-600 border-orange-600"
                                                onClick={() => handleStatusChange(selectedUser.id, 'SUSPENDED')}
                                                disabled={actionLoading === selectedUser.id}
                                            >
                                                <Ban className="w-4 h-4 mr-2" />
                                                ระงับการใช้งาน
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                className="flex-1 text-green-600 border-green-600"
                                                onClick={() => handleStatusChange(selectedUser.id, 'ACTIVE')}
                                                disabled={actionLoading === selectedUser.id}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                เปิดใช้งาน
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            className="text-red-600 border-red-600"
                                            onClick={() => handleDelete(selectedUser.id)}
                                            disabled={actionLoading === selectedUser.id}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
