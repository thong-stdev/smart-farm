"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogOut, Link2, User } from "lucide-react";
import api from "@/services/api";
interface UserProfile {
    id: string;
    displayName: string;
    firstName: string;
    lastName: string;
    providers: { provider: string; email: string }[];
}

export default function ProfilePage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get<UserProfile>('/users/profile');
            setUser(res);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLink = (provider: string) => {
        // In reality, this should redirect to OAuth
        // For Proof of Concept, we just alert
        alert(`ระบบเชื่อมต่อ ${provider} กำลังพัฒนา... (Backend API พร้อมแล้ว)`);
    };

    const handleUnlink = async (provider: string) => {
        if (!confirm(`คุณต้องการยกเลิกการเชื่อมต่อกับ ${provider} ใช่หรือไม่?`)) return;

        try {
            await api.delete(`/users/providers/${provider}`);
            alert("ยกเลิกการเชื่อมต่อสำเร็จ");
            fetchProfile(); // Reload
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            alert(err.message || "เกิดข้อผิดพลาด ไม่สามารถยกเลิกบัญชีสุดท้ายได้");
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;

    return (
        <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">บัญชีผู้ใช้</h1>
                <p className="text-gray-500">จัดการข้อมูลส่วนตัวและการเชื่อมต่อ</p>
            </div>

            {/* Profile Info */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.displayName}`} />
                            <AvatarFallback>{user?.displayName?.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="text-center sm:text-left space-y-2 flex-1">
                            <h2 className="text-2xl font-bold">{user?.displayName || "ไม่ได้ระบุชื่อ"}</h2>
                            <p className="text-gray-500 flex items-center justify-center sm:justify-start gap-2">
                                <User className="w-4 h-4" />
                                {user?.firstName} {user?.lastName}
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-2">
                                <Badge variant="secondary">Member</Badge>
                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Active</Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Social Accounts */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Link2 className="w-5 h-5" />
                        บัญชีที่เชื่อมต่อ (Linked Accounts)
                    </CardTitle>
                    <CardDescription>จัดการช่องทางการเข้าสู่ระบบ</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* LINE */}
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#06C755] rounded-full flex items-center justify-center text-white font-bold">L</div>
                            <div>
                                <p className="font-medium text-gray-900">LINE</p>
                                <p className="text-sm text-gray-500">
                                    {user?.providers.find(p => p.provider === 'LINE')?.email || "ยังไม่เชื่อมต่อ"}
                                </p>
                            </div>
                        </div>
                        {user?.providers.some(p => p.provider === 'LINE') ? (
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleUnlink('LINE')}
                            >
                                ยกเลิกเชื่อมต่อ
                            </Button>
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => handleLink('LINE')}>
                                เชื่อมต่อ
                            </Button>
                        )}
                    </div>

                    {/* Google */}
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white border rounded-full flex items-center justify-center shadow-sm">
                                <span className="font-bold text-blue-600">G</span>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Google</p>
                                <p className="text-sm text-gray-500">
                                    {user?.providers.find(p => p.provider === 'GOOGLE')?.email || "ยังไม่เชื่อมต่อ"}
                                </p>
                            </div>
                        </div>
                        {user?.providers.some(p => p.provider === 'GOOGLE') ? (
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleUnlink('GOOGLE')}
                            >
                                ยกเลิกเชื่อมต่อ
                            </Button>
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => handleLink('GOOGLE')}>
                                เชื่อมต่อ
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-center">
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                    <LogOut className="w-4 h-4 mr-2" />
                    ออกจากระบบ
                </Button>
            </div>
        </div>
    );
}
