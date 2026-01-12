"use client";

import { useState, useEffect, useCallback } from "react";
import { Database, Download, Loader2, HardDrive, Users, Sprout, ClipboardList, Package, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface BackupStats {
    users: number;
    plots: number;
    activities: number;
    products: number;
    cropCycles: number;
    lastBackup: string | null;
    dbSize: string;
}

export default function AdminBackupPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [stats, setStats] = useState<BackupStats | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/backup/stats`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                setStats(await res.json());
            }
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/backup/export`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `smartfarm_backup_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                alert('สำรองข้อมูลสำเร็จ!');
            } else {
                alert('เกิดข้อผิดพลาด');
            }
        } catch (err) {
            console.error('Failed to export:', err);
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            </div>
        );
    }

    const statItems = [
        { icon: Users, label: 'ผู้ใช้', value: stats?.users || 0, color: 'bg-blue-100 text-blue-600' },
        { icon: Sprout, label: 'แปลง', value: stats?.plots || 0, color: 'bg-green-100 text-green-600' },
        { icon: ClipboardList, label: 'กิจกรรม', value: stats?.activities || 0, color: 'bg-purple-100 text-purple-600' },
        { icon: Package, label: 'สินค้า', value: stats?.products || 0, color: 'bg-yellow-100 text-yellow-600' },
        { icon: Sprout, label: 'รอบการปลูก', value: stats?.cropCycles || 0, color: 'bg-emerald-100 text-emerald-600' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">สำรองข้อมูล</h1>
                    <p className="text-gray-500">Export ข้อมูลระบบ</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchStats}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        รีเฟรช
                    </Button>
                    <Button onClick={handleExport} disabled={isExporting}>
                        {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                        Export JSON
                    </Button>
                </div>
            </div>

            {/* Database Overview */}
            <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        ภาพรวมฐานข้อมูล
                    </CardTitle>
                    <CardDescription>ข้อมูลในระบบทั้งหมด</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {statItems.map((item) => (
                            <div key={item.label} className="bg-white rounded-lg p-4 text-center shadow-sm">
                                <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center mx-auto mb-2`}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <p className="text-2xl font-bold text-gray-800">{formatNumber(item.value)}</p>
                                <p className="text-sm text-gray-500">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Backup Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download className="w-5 h-5 text-green-600" />
                            Export ข้อมูล
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600">
                            ดาวน์โหลดข้อมูลทั้งหมดในรูปแบบ JSON สำหรับสำรองข้อมูลหรือย้ายระบบ
                        </p>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700 mb-2">ข้อมูลที่จะส่งออก:</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>✓ ข้อมูลผู้ใช้ (ไม่รวมรหัสผ่าน)</li>
                                <li>✓ แปลงและรอบการปลูก</li>
                                <li>✓ กิจกรรมและการเงิน</li>
                                <li>✓ สินค้าและหมวดหมู่</li>
                                <li>✓ ประเภทพืชและพันธุ์</li>
                            </ul>
                        </div>
                        <Button className="w-full" onClick={handleExport} disabled={isExporting}>
                            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                            ดาวน์โหลด Backup
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HardDrive className="w-5 h-5 text-blue-600" />
                            ข้อมูลระบบ
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-600">ขนาด Database</span>
                                <span className="font-medium">{stats?.dbSize || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-600">Backup ล่าสุด</span>
                                <span className="font-medium">{stats?.lastBackup || 'ยังไม่เคย Backup'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-600">รูปแบบ</span>
                                <span className="font-medium">JSON</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-gray-600">เวอร์ชัน</span>
                                <span className="font-medium">1.0</span>
                            </div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                            💡 แนะนำให้สำรองข้อมูลเป็นประจำทุกสัปดาห์
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
