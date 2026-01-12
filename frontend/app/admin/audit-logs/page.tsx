"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Loader2, Search, User, Shield, Bot, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface AuditLog {
    id: string;
    actorType: 'USER' | 'ADMIN' | 'SYSTEM';
    actorId: string | null;
    action: string;
    target: string;
    targetId: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    ip: string | null;
    createdAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function AdminAuditLogsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 });

    // Filters
    const [actorType, setActorType] = useState<string>('');
    const [target, setTarget] = useState('');
    const [action, setAction] = useState('');

    const fetchLogs = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('adminToken');

            const params = new URLSearchParams();
            params.append('page', pagination.page.toString());
            params.append('limit', '50');
            if (actorType) params.append('actorType', actorType);
            if (target) params.append('target', target);
            if (action) params.append('action', action);

            const res = await fetch(`${API_URL}/admin/audit-logs?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setLogs(data.data || []);
                setPagination(prev => data.pagination || prev);
            }
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setIsLoading(false);
        }
    }, [pagination.page, actorType, target, action]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const getActorIcon = (type: string) => {
        switch (type) {
            case 'USER': return <User className="w-4 h-4 text-blue-500" />;
            case 'ADMIN': return <Shield className="w-4 h-4 text-purple-500" />;
            case 'SYSTEM': return <Bot className="w-4 h-4 text-gray-500" />;
            default: return <User className="w-4 h-4" />;
        }
    };

    const getActorBadgeClass = (type: string) => {
        switch (type) {
            case 'USER': return 'bg-blue-100 text-blue-700';
            case 'ADMIN': return 'bg-purple-100 text-purple-700';
            case 'SYSTEM': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
                    <p className="text-gray-500">ประวัติการใช้งานระบบ</p>
                </div>
                <Button onClick={fetchLogs} variant="outline" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    รีเฟรช
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-sm font-medium text-gray-700 mb-1 block">ประเภทผู้กระทำ</label>
                            <select
                                className="w-full p-2 border rounded-lg"
                                value={actorType}
                                onChange={(e) => setActorType(e.target.value)}
                            >
                                <option value="">ทั้งหมด</option>
                                <option value="USER">ผู้ใช้</option>
                                <option value="ADMIN">แอดมิน</option>
                                <option value="SYSTEM">ระบบ</option>
                            </select>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-sm font-medium text-gray-700 mb-1 block">เป้าหมาย</label>
                            <Input
                                placeholder="เช่น Plot, Activity, User"
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-sm font-medium text-gray-700 mb-1 block">การกระทำ</label>
                            <Input
                                placeholder="เช่น CREATE, UPDATE, DELETE"
                                value={action}
                                onChange={(e) => setAction(e.target.value)}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button onClick={fetchLogs} className="gap-2">
                                <Search className="w-4 h-4" />
                                ค้นหา
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{pagination.total}</p>
                            <p className="text-sm text-gray-500">รายการทั้งหมด</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Logs Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        รายการ Audit Logs
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>ยังไม่มี Audit Logs</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-3 font-medium text-gray-700">เวลา</th>
                                        <th className="text-left p-3 font-medium text-gray-700">ผู้กระทำ</th>
                                        <th className="text-left p-3 font-medium text-gray-700">การกระทำ</th>
                                        <th className="text-left p-3 font-medium text-gray-700">เป้าหมาย</th>
                                        <th className="text-left p-3 font-medium text-gray-700">IP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr key={log.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3 text-sm text-gray-600">
                                                {formatDate(log.createdAt)}
                                            </td>
                                            <td className="p-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getActorBadgeClass(log.actorType)}`}>
                                                    {getActorIcon(log.actorType)}
                                                    {log.actorType}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <span className="px-2 py-1 rounded bg-gray-100 text-sm font-mono">
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <span className="font-medium">{log.target}</span>
                                                {log.targetId && (
                                                    <span className="text-gray-400 text-xs ml-1">
                                                        ({log.targetId.slice(0, 8)}...)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-sm text-gray-500 font-mono">
                                                {log.ip || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <p className="text-sm text-gray-500">
                                หน้า {pagination.page} จาก {pagination.totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pagination.page <= 1}
                                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                >
                                    ก่อนหน้า
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pagination.page >= pagination.totalPages}
                                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                >
                                    ถัดไป
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
