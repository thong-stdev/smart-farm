"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, Save, Bell, Shield, Loader2, Key, Brain, Globe, Smartphone, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface SystemSettings {
    id: string;
    // Branding
    siteName: string;
    siteDescription: string | null;
    logoUrl: string | null;
    faviconUrl: string | null;
    // Contact
    supportEmail: string | null;
    supportPhone: string | null;
    // Localization
    defaultLanguage: string;
    timezone: string;
    // System State
    maintenanceMode: boolean;
    maintenanceMessage: string | null;
    // AI Config
    enableAI: boolean;
    aiMode: string;
    maxAIRequestsPerUserPerDay: number;
    maxAIRequestsSystemPerDay: number;
    aiMinConfidence: number;
    aiRecommendCropPlan: boolean;
    aiRecommendActivity: boolean;
    aiRecommendProduct: boolean;
    aiRecommendDisease: boolean;
    aiRequireUserConfirmation: boolean;
    aiPromptVersion: string;
    aiExperimentGroup: string | null;
    // AI Providers
    aiProvider: string;
    aiModel: string;
    // Social Login
    lineClientId: string | null;
    lineClientSecret: string | null;
    lineEnabled: boolean;
    googleClientId: string | null;
    googleClientSecret: string | null;
    googleEnabled: boolean;
    facebookAppId: string | null;
    facebookAppSecret: string | null;
    facebookEnabled: boolean;
    // Notifications
    enableNotifications: boolean;
    enableEmailNotifications: boolean;
    enablePushNotifications: boolean;
}

const AI_MODES = [
    { value: 'ASSIST', label: 'แนะนำ', desc: 'AI แนะนำ ผู้ใช้ตัดสินใจ' },
    { value: 'AUTO', label: 'อัตโนมัติ', desc: 'AI ทำงานอัตโนมัติ' },
    { value: 'DISABLED', label: 'ปิด', desc: 'ปิดการใช้งาน AI' },
];

const AI_PROVIDERS = [
    { value: 'mock', label: 'Mock', desc: 'ทดสอบ (ไม่ต้องใช้ API key)', icon: '🧪', free: true },
    { value: 'gemini', label: 'Google Gemini', desc: 'ฟรี 60 req/นาที', icon: '✨', free: true },
    { value: 'groq', label: 'Groq (Llama)', desc: 'ฟรี เร็วมาก', icon: '⚡', free: true },
    { value: 'openai', label: 'OpenAI', desc: 'GPT-3.5/4', icon: '🤖', free: false },
    { value: 'claude', label: 'Anthropic Claude', desc: 'Claude 3', icon: '🔮', free: false },
];

export default function AdminSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'social' | 'notifications' | 'jobs'>('general');
    const [settings, setSettings] = useState<SystemSettings>({
        id: 'system',
        siteName: "Smart Farm",
        siteDescription: "",
        logoUrl: "",
        faviconUrl: "",
        supportEmail: "",
        supportPhone: "",
        defaultLanguage: "th",
        timezone: "Asia/Bangkok",
        maintenanceMode: false,
        maintenanceMessage: "",
        enableAI: true,
        aiMode: "ASSIST",
        maxAIRequestsPerUserPerDay: 10,
        maxAIRequestsSystemPerDay: 10000,
        aiMinConfidence: 0.7,
        aiRecommendCropPlan: true,
        aiRecommendActivity: true,
        aiRecommendProduct: true,
        aiRecommendDisease: true,
        aiRequireUserConfirmation: true,
        aiPromptVersion: "v1",
        aiExperimentGroup: "",
        aiProvider: "mock",
        aiModel: "mock-v1",
        lineClientId: "",
        lineClientSecret: "",
        lineEnabled: false,
        googleClientId: "",
        googleClientSecret: "",
        googleEnabled: false,
        facebookAppId: "",
        facebookAppSecret: "",
        facebookEnabled: false,
        enableNotifications: true,
        enableEmailNotifications: true,
        enablePushNotifications: true,
    });

    // AI Models from API
    const [aiModels, setAiModels] = useState<Record<string, { id: string; name: string; description?: string }[]>>({});
    const [loadingModels, setLoadingModels] = useState(false);

    const fetchAiModels = useCallback(async () => {
        try {
            setLoadingModels(true);
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/ai/models`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setAiModels(data);
            }
        } catch (err) {
            console.error('Failed to fetch AI models:', err);
        } finally {
            setLoadingModels(false);
        }
    }, []);

    const fetchSettings = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/settings`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setSettings(prev => ({ ...prev, ...data }));
            }
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
        fetchAiModels();
    }, [fetchSettings, fetchAiModels]);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/settings`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings),
            });
            if (res.ok) {
                alert('บันทึกการตั้งค่าเรียบร้อย!');
            } else {
                alert('เกิดข้อผิดพลาด');
            }
        } catch (err) {
            console.error('Failed to save:', err);
            alert('เกิดข้อผิดพลาด');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            </div>
        );
    }

    const tabs = [
        { id: 'general', label: 'ทั่วไป', icon: Settings },
        { id: 'ai', label: 'AI', icon: Brain },
        { id: 'social', label: 'Social Login', icon: Key },
        { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell },
        { id: 'jobs', label: 'Background Jobs', icon: Settings },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าระบบ</h1>
                    <p className="text-gray-500">กำหนดค่าการทำงานของระบบ</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    บันทึก
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            setActiveTab(tab.id as any);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${activeTab === tab.id
                            ? 'border-yellow-500 text-yellow-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* General Tab */}
            {activeTab === 'general' && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="w-5 h-5" />
                                Branding
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>ชื่อระบบ</Label>
                                    <Input value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>คำอธิบาย</Label>
                                    <Input value={settings.siteDescription || ''} onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>URL โลโก้</Label>
                                    <Input value={settings.logoUrl || ''} onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })} placeholder="https://..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>URL Favicon</Label>
                                    <Input value={settings.faviconUrl || ''} onChange={(e) => setSettings({ ...settings, faviconUrl: e.target.value })} placeholder="https://..." />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="w-5 h-5" />
                                ติดต่อ
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>อีเมลติดต่อ</Label>
                                    <Input type="email" value={settings.supportEmail || ''} onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>เบอร์โทรศัพท์</Label>
                                    <Input value={settings.supportPhone || ''} onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                ระบบ
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.maintenanceMode}
                                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-red-500"
                                />
                                <div>
                                    <span className="text-gray-700 font-medium">โหมดบำรุงรักษา</span>
                                    <p className="text-sm text-gray-500">ปิดการเข้าถึงระบบชั่วคราว</p>
                                </div>
                            </label>
                            {settings.maintenanceMode && (
                                <div className="space-y-2 ml-7">
                                    <Label>ข้อความแจ้งผู้ใช้</Label>
                                    <Input value={settings.maintenanceMessage || ''} onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })} placeholder="ระบบกำลังปรับปรุง..." />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* AI Tab */}
            {activeTab === 'ai' && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Brain className="w-5 h-5" />
                                AI Configuration
                            </CardTitle>
                            <CardDescription>ตั้งค่าการทำงานของ AI</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.enableAI}
                                    onChange={(e) => setSettings({ ...settings, enableAI: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-yellow-500"
                                />
                                <span className="text-gray-700 font-medium">เปิดใช้งาน AI</span>
                            </label>

                            {settings.enableAI && (
                                <>
                                    <div className="space-y-2">
                                        <Label>โหมด AI</Label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {AI_MODES.map(mode => (
                                                <button
                                                    key={mode.value}
                                                    type="button"
                                                    onClick={() => setSettings({ ...settings, aiMode: mode.value })}
                                                    className={`p-3 rounded-lg border text-center ${settings.aiMode === mode.value
                                                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <p className="font-medium">{mode.label}</p>
                                                    <p className="text-xs text-gray-500">{mode.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Requests/User/Day</Label>
                                            <Input type="number" value={settings.maxAIRequestsPerUserPerDay} onChange={(e) => setSettings({ ...settings, maxAIRequestsPerUserPerDay: parseInt(e.target.value) || 0 })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Requests/System/Day</Label>
                                            <Input type="number" value={settings.maxAIRequestsSystemPerDay} onChange={(e) => setSettings({ ...settings, maxAIRequestsSystemPerDay: parseInt(e.target.value) || 0 })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Min Confidence</Label>
                                            <Input type="number" step="0.1" min="0" max="1" value={settings.aiMinConfidence} onChange={(e) => setSettings({ ...settings, aiMinConfidence: parseFloat(e.target.value) || 0 })} />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label>AI แนะนำ</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {[
                                                { key: 'aiRecommendCropPlan', label: 'แผนการปลูก' },
                                                { key: 'aiRecommendActivity', label: 'กิจกรรม' },
                                                { key: 'aiRecommendProduct', label: 'สินค้า' },
                                                { key: 'aiRecommendDisease', label: 'โรคพืช' },
                                            ].map(item => (
                                                <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                        checked={(settings as any)[item.key]}
                                                        onChange={(e) => {
                                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                            setSettings({ ...settings, [item.key]: e.target.checked as any });
                                                        }}
                                                        className="w-4 h-4 rounded border-gray-300 text-yellow-500"
                                                    />
                                                    <span className="text-sm text-gray-700">{item.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.aiRequireUserConfirmation}
                                            onChange={(e) => setSettings({ ...settings, aiRequireUserConfirmation: e.target.checked })}
                                            className="w-4 h-4 rounded border-gray-300 text-yellow-500"
                                        />
                                        <span className="text-gray-700">ต้องให้ผู้ใช้ยืนยันก่อนทำรายการ</span>
                                    </label>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* AI Provider Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="w-5 h-5" />
                                AI Provider
                            </CardTitle>
                            <CardDescription>
                                เลือก AI ที่ต้องการใช้งาน (ตั้งค่า API Key ใน .env)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {AI_PROVIDERS.map(provider => {
                                    const isCurrent = settings.aiProvider === provider.value;

                                    return (
                                        <button
                                            key={provider.value}
                                            type="button"
                                            onClick={() => setSettings({ ...settings, aiProvider: provider.value, aiModel: '' })}
                                            className={`p-4 rounded-lg border text-left transition-all relative ${isCurrent
                                                ? 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-200'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xl">{provider.icon}</span>
                                                <p className="font-medium text-gray-900">{provider.label}</p>
                                                {provider.free && (
                                                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">ฟรี</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500">{provider.desc}</p>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Model Selector - แสดงเมื่อเลือก provider ที่ไม่ใช่ mock */}
                            {settings.aiProvider !== 'mock' && (
                                <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <Label>เลือก Model</Label>
                                        {loadingModels && (
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                กำลังโหลด...
                                            </span>
                                        )}
                                    </div>
                                    <select
                                        value={settings.aiModel || ''}
                                        onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                                        className="w-full p-2 border rounded-lg bg-white"
                                    >
                                        {(aiModels[settings.aiProvider] || []).map((model) => (
                                            <option key={model.id} value={model.id}>
                                                {model.name} {model.description ? `(${model.description})` : ''}
                                            </option>
                                        ))}
                                        {(!aiModels[settings.aiProvider] || aiModels[settings.aiProvider].length === 0) && (
                                            <option value="">กำลังโหลด models...</option>
                                        )}
                                    </select>
                                    <p className="text-xs text-gray-400">
                                        ✨ รายการ models ดึงจาก API โดยอัตโนมัติ
                                    </p>
                                </div>
                            )}

                            {/* Info box */}
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-sm text-blue-700 font-medium mb-2">📝 วิธีเพิ่ม AI Provider</p>
                                <ol className="text-xs text-blue-600 space-y-1 list-decimal list-inside">
                                    <li>สมัคร API Key จากผู้ให้บริการ (ดูลิงก์ด้านล่าง)</li>
                                    <li>เพิ่ม API Key ในไฟล์ <code className="bg-blue-100 px-1 rounded">.env</code></li>
                                    <li>Restart backend server</li>
                                    <li>กลับมาเลือก provider และ model ที่นี่</li>
                                </ol>
                            </div>

                            {/* Links to sign up */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                <a href="https://aistudio.google.com/apikey" target="_blank"
                                    className="p-2 bg-gray-50 rounded text-center hover:bg-gray-100">
                                    ✨ Gemini <span className="text-green-600">(ฟรี)</span>
                                </a>
                                <a href="https://console.groq.com" target="_blank"
                                    className="p-2 bg-gray-50 rounded text-center hover:bg-gray-100">
                                    ⚡ Groq <span className="text-green-600">(ฟรี)</span>
                                </a>
                                <a href="https://platform.openai.com" target="_blank"
                                    className="p-2 bg-gray-50 rounded text-center hover:bg-gray-100">
                                    🤖 OpenAI
                                </a>
                                <a href="https://console.anthropic.com" target="_blank"
                                    className="p-2 bg-gray-50 rounded text-center hover:bg-gray-100">
                                    🔮 Claude
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Social Login Tab */}
            {activeTab === 'social' && (
                <div className="space-y-6">
                    {/* Info Box */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-sm text-blue-700 font-medium mb-2">📝 วิธีตั้งค่า Social Login</p>
                        <ol className="text-xs text-blue-600 space-y-1 list-decimal list-inside">
                            <li>สมัคร Developer Account ที่แต่ละ Provider (ดูลิงก์ในแต่ละ Card)</li>
                            <li>สร้าง App และกรอก Callback URL ตามที่แสดง</li>
                            <li>Copy Client ID / Secret มากรอกด้านล่างแล้วกด บันทึก</li>
                            <li>เปิดใช้งาน Toggle แล้วทดสอบ Login</li>
                        </ol>
                    </div>

                    {/* LINE */}
                    <Card className={settings.lineEnabled ? 'border-green-200' : ''}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <span className="w-6 h-6 bg-green-500 rounded text-white flex items-center justify-center text-xs font-bold">L</span>
                                    LINE Login
                                </CardTitle>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={settings.lineEnabled} onChange={(e) => setSettings({ ...settings, lineEnabled: e.target.checked })} className="w-4 h-4 rounded text-green-500" />
                                    <span className="text-sm">เปิดใช้งาน</span>
                                </label>
                            </div>
                            <CardDescription>
                                <a href="https://developers.line.biz/console/" target="_blank" className="text-green-600 hover:underline">
                                    🔗 สมัครที่ LINE Developers Console
                                </a>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Channel ID</Label>
                                    <Input
                                        placeholder="1234567890"
                                        value={settings.lineClientId || ''}
                                        onChange={(e) => setSettings({ ...settings, lineClientId: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Channel Secret</Label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••••••"
                                        value={settings.lineClientSecret || ''}
                                        onChange={(e) => setSettings({ ...settings, lineClientSecret: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                                <strong>Callback URL:</strong> <code className="bg-gray-100 px-1 rounded">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/line/callback</code>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Google */}
                    <Card className={settings.googleEnabled ? 'border-blue-200' : ''}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <span className="w-6 h-6 bg-blue-500 rounded text-white flex items-center justify-center text-xs font-bold">G</span>
                                    Google Login
                                </CardTitle>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={settings.googleEnabled} onChange={(e) => setSettings({ ...settings, googleEnabled: e.target.checked })} className="w-4 h-4 rounded text-blue-500" />
                                    <span className="text-sm">เปิดใช้งาน</span>
                                </label>
                            </div>
                            <CardDescription>
                                <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="text-blue-600 hover:underline">
                                    🔗 สมัครที่ Google Cloud Console
                                </a>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Client ID</Label>
                                    <Input
                                        placeholder="xxxxxx.apps.googleusercontent.com"
                                        value={settings.googleClientId || ''}
                                        onChange={(e) => setSettings({ ...settings, googleClientId: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Client Secret</Label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••••••"
                                        value={settings.googleClientSecret || ''}
                                        onChange={(e) => setSettings({ ...settings, googleClientSecret: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                                <strong>Callback URL:</strong> <code className="bg-gray-100 px-1 rounded">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/google/callback</code>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Facebook */}
                    <Card className={settings.facebookEnabled ? 'border-indigo-200' : ''}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <span className="w-6 h-6 bg-indigo-600 rounded text-white flex items-center justify-center text-xs font-bold">f</span>
                                    Facebook Login
                                </CardTitle>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={settings.facebookEnabled} onChange={(e) => setSettings({ ...settings, facebookEnabled: e.target.checked })} className="w-4 h-4 rounded text-indigo-500" />
                                    <span className="text-sm">เปิดใช้งาน</span>
                                </label>
                            </div>
                            <CardDescription>
                                <a href="https://developers.facebook.com/apps/" target="_blank" className="text-indigo-600 hover:underline">
                                    🔗 สมัครที่ Facebook Developers
                                </a>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>App ID</Label>
                                    <Input
                                        placeholder="1234567890123456"
                                        value={settings.facebookAppId || ''}
                                        onChange={(e) => setSettings({ ...settings, facebookAppId: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>App Secret</Label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••••••"
                                        value={settings.facebookAppSecret || ''}
                                        onChange={(e) => setSettings({ ...settings, facebookAppSecret: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                                <strong>Callback URL:</strong> <code className="bg-gray-100 px-1 rounded">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/facebook/callback</code>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            การแจ้งเตือน
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.enableNotifications}
                                onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-yellow-500"
                            />
                            <span className="text-gray-700 font-medium">เปิดใช้งานการแจ้งเตือน</span>
                        </label>

                        {settings.enableNotifications && (
                            <div className="ml-7 space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.enableEmailNotifications}
                                        onChange={(e) => setSettings({ ...settings, enableEmailNotifications: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300 text-yellow-500"
                                    />
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-700">แจ้งเตือนทางอีเมล</span>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.enablePushNotifications}
                                        onChange={(e) => setSettings({ ...settings, enablePushNotifications: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300 text-yellow-500"
                                    />
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-700">Push Notification</span>
                                    </div>
                                </label>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Background Jobs Tab */}
            {activeTab === 'jobs' && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="w-5 h-5" />
                                Background Job Configuration
                            </CardTitle>
                            <CardDescription>การตั้งค่าระบบ Background Jobs สำหรับลบข้อมูล</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Info Box */}
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-sm text-blue-700 font-medium mb-2">ℹ️ เกี่ยวกับ Background Jobs</p>
                                <p className="text-xs text-blue-600">
                                    ระบบ Background Jobs จะประมวลผลการลบข้อมูลจำนวนมากในพื้นหลัง เพื่อป้องกันการ timeout และ database lock
                                </p>
                            </div>

                            {/* Batch Settings - Read Only */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-gray-900">Batch Settings</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Batch Size</Label>
                                        <div className="p-3 bg-gray-50 rounded-lg border">
                                            <p className="text-lg font-semibold text-gray-900">500 rows</p>
                                            <p className="text-xs text-gray-500">จำนวน rows ที่ลบต่อครั้ง</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Cron Interval</Label>
                                        <div className="p-3 bg-gray-50 rounded-lg border">
                                            <p className="text-lg font-semibold text-gray-900">10 วินาที</p>
                                            <p className="text-xs text-gray-500">ความถี่ในการตรวจสอบ job</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Lock Timeout</Label>
                                        <div className="p-3 bg-gray-50 rounded-lg border">
                                            <p className="text-lg font-semibold text-gray-900">5 นาที</p>
                                            <p className="text-xs text-gray-500">เวลาที่ lock job หมดอายุ</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Max Retry</Label>
                                        <div className="p-3 bg-gray-50 rounded-lg border">
                                            <p className="text-lg font-semibold text-gray-900">3 ครั้ง</p>
                                            <p className="text-xs text-gray-500">จำนวนครั้งที่ retry เมื่อล้มเหลว</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Job Worker Status */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-gray-900">Worker Status</h3>
                                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <p className="text-sm font-medium text-green-700">Worker กำลังทำงาน</p>
                                    </div>
                                    <p className="text-xs text-green-600">
                                        Background worker จะประมวลผล pending jobs อัตโนมัติทุก 10 วินาที
                                    </p>
                                </div>
                            </div>

                            {/* Configuration Note */}
                            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <p className="text-sm text-yellow-700 font-medium mb-2">⚙️ การปรับแต่งค่า</p>
                                <p className="text-xs text-yellow-600 mb-2">
                                    หากต้องการปรับเปลี่ยนค่าเหล่านี้ ให้แก้ไขที่ไฟล์:
                                </p>
                                <ul className="text-xs text-yellow-600 space-y-1 list-disc list-inside">
                                    <li><code className="bg-yellow-100 px-1 rounded">backend/src/modules/job/job-worker.service.ts</code> - Batch Size</li>
                                    <li><code className="bg-yellow-100 px-1 rounded">backend/src/modules/job/job-worker.service.ts</code> - Cron Interval (@Cron decorator)</li>
                                    <li><code className="bg-yellow-100 px-1 rounded">backend/src/modules/job/job.service.ts</code> - Lock Timeout & Max Retry</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
