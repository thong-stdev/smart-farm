"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Globe, Save } from "lucide-react";
import api from "@/services/api";

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        notifications: true,
        darkMode: false,
        language: "th",
        unit: "METRIC"
    });
    const [isLoading, setIsLoading] = useState(false);

    const fetchSettings = useCallback(async () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res = await api.get<any>('/users/profile');
            if (res.settings) {
                setSettings(prev => ({
                    ...prev,
                    language: res.settings.language || "th",
                    unit: res.settings.unit || "METRIC"
                    // notifications/darkMode usually in local state or separate
                }));
            }
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        // Fetch User Settings
        fetchSettings();
    }, [fetchSettings]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await api.patch('/users/settings', {
                language: settings.language,
                unit: settings.unit
            });
            // Show success toast (mock)
            alert("บันทึกการตั้งค่าแล้ว");
        } catch (error) {
            console.error(error);
            alert("เกิดข้อผิดพลาด");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">การตั้งค่า</h1>
                <p className="text-gray-500">จัดการการตั้งค่าระบบและการใช้งาน</p>
            </div>

            {/* General Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        ทั่วไป
                    </CardTitle>
                    <CardDescription>ตั้งค่าภาษาและหน่วยวัด</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>ภาษา (Language)</Label>
                            <p className="text-xs text-gray-500">ภาษาที่แสดงในระบบ</p>
                        </div>
                        <Select
                            value={settings.language}
                            onValueChange={(val) => setSettings({ ...settings, language: val })}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="เลือกภาษา" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="th">ภาษาไทย 🇹🇭</SelectItem>
                                <SelectItem value="en">English 🇺🇸</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>หน่วยวัด (Units)</Label>
                            <p className="text-xs text-gray-500">หน่วยพื้นที่และน้ำหนัก</p>
                        </div>
                        <Select
                            value={settings.unit}
                            onValueChange={(val) => setSettings({ ...settings, unit: val })}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="เลือกหน่วย" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="METRIC">เมตริก (ไร่/กก.)</SelectItem>
                                <SelectItem value="IMPERIAL">อิมพีเรียล (Acre/Lb)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        การแจ้งเตือน
                    </CardTitle>
                    <CardDescription>จัดการข้อมูลข่าวสารและการเตือน</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>แจ้งเตือนกิจกรรม</Label>
                            <p className="text-xs text-gray-500">เตือนเมื่อถึงกำหนดการเกษตร</p>
                        </div>
                        <Switch
                            checked={settings.notifications}
                            onCheckedChange={(val) => setSettings({ ...settings, notifications: val })}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isLoading} className="bg-farm-green-600 hover:bg-farm-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
                </Button>
            </div>
        </div>
    );
}
