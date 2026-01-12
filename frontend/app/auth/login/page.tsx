"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sprout, Lock, Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "เข้าสู่ระบบไม่สำเร็จ");
            }

            // บันทึก token
            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("user", JSON.stringify(data.user));

            // ไปหน้า Dashboard
            router.push("/web/dashboard");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Mock LINE Login
    const handleLineLogin = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/auth/line/mock`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    lineUserId: `U${Date.now()}`,
                    displayName: "LINE User",
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("user", JSON.stringify(data.user));
            router.push("/web/dashboard");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch {
            setError("เข้าสู่ระบบด้วย LINE ไม่สำเร็จ");
        } finally {
            setIsLoading(false);
        }
    };

    // Mock Google Login
    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/auth/google/mock`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    googleId: `g${Date.now()}`,
                    email: `google${Date.now()}@gmail.com`,
                    displayName: "Google User",
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("user", JSON.stringify(data.user));
            router.push("/web/dashboard");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch {
            setError("เข้าสู่ระบบด้วย Google ไม่สำเร็จ");
        } finally {
            setIsLoading(false);
        }
    };

    // Mock Facebook Login
    const handleFacebookLogin = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/auth/facebook/mock`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    facebookId: `fb${Date.now()}`,
                    email: `fb${Date.now()}@facebook.com`,
                    displayName: "Facebook User",
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("user", JSON.stringify(data.user));
            router.push("/web/dashboard");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch {
            setError("เข้าสู่ระบบด้วย Facebook ไม่สำเร็จ");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-farm-green-50 to-white flex items-center justify-center p-4">
            <div className="w-full max-w-md animate-slide-up">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-12 h-12 rounded-xl gradient-farm flex items-center justify-center">
                        <Sprout className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-farm-green-800">Smart Farm</span>
                </div>

                <Card>
                    <CardHeader className="text-center">
                        <CardTitle>เข้าสู่ระบบ</CardTitle>
                        <CardDescription>
                            เข้าสู่ระบบเพื่อจัดการแปลงเกษตรของคุณ
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">อีเมล</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="your@email.com"
                                        className="pl-10"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">รหัสผ่าน</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="pl-10 pr-10"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        กำลังเข้าสู่ระบบ...
                                    </>
                                ) : (
                                    "เข้าสู่ระบบ"
                                )}
                            </Button>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-2 text-gray-500">หรือ</span>
                            </div>
                        </div>

                        {/* Social Login */}
                        <div className="space-y-3">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full relative bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                            >
                                <svg className="w-5 h-5 absolute left-4" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                เข้าสู่ระบบด้วย Google
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full relative bg-[#1877F2] hover:bg-[#166fe5] text-white border-transparent"
                                onClick={handleFacebookLogin}
                                disabled={isLoading}
                            >
                                <svg className="w-5 h-5 absolute left-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                เข้าสู่ระบบด้วย Facebook
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full relative bg-[#06C755] hover:bg-[#05b34c] text-white border-transparent"
                                onClick={handleLineLogin}
                                disabled={isLoading}
                            >
                                <svg className="w-5 h-5 absolute left-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 5.67 2 10.15c0 4.07 3.67 7.48 8.63 8.12.34.07.8.22.91.51.11.26.07.66.04.93l-.14.88c-.04.27-.21 1.05.92.57 1.14-.48 6.14-3.62 8.38-6.2C22.1 13.37 22 11.8 22 10.15 22 5.67 17.52 2 12 2z" />
                                </svg>
                                เข้าสู่ระบบด้วย LINE
                            </Button>
                        </div>

                        <p className="mt-6 text-center text-sm text-gray-600">
                            ยังไม่มีบัญชี?{" "}
                            <Link href="/auth/register" className="text-farm-green-600 hover:underline font-medium">
                                สมัครสมาชิก
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
