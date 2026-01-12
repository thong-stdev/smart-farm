"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function AdminLoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_URL}/auth/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
            }

            // บันทึก token และข้อมูล admin
            localStorage.setItem('adminToken', data.accessToken);
            localStorage.setItem('admin', JSON.stringify(data.admin));
            localStorage.setItem('isAdmin', 'true');

            // ไปหน้า Admin Dashboard
            router.push('/admin/dashboard');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500 mb-4">
                        <Shield className="w-8 h-8 text-gray-900" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                    <p className="text-gray-400">Smart Farm Management System</p>
                </div>

                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-white">เข้าสู่ระบบ Admin</CardTitle>
                        <CardDescription className="text-gray-400">
                            กรุณากรอกชื่อผู้ใช้และรหัสผ่าน
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-900/50 border border-red-700 text-red-200 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-gray-200">ชื่อผู้ใช้</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="admin"
                                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-gray-200">รหัสผ่าน</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        กำลังเข้าสู่ระบบ...
                                    </>
                                ) : (
                                    'เข้าสู่ระบบ'
                                )}
                            </Button>

                            <div className="text-center">
                                <Link
                                    href="/"
                                    className="inline-flex items-center text-sm text-gray-400 hover:text-white"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-1" />
                                    กลับหน้าหลัก
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center mt-4 text-gray-500 text-sm">
                    Admin: admin / admin123
                </p>
            </div>
        </div>
    );
}
