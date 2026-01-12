"use client";

import { useState, useEffect } from "react";
import {
    Trophy,
    RefreshCw,
    Loader2,
    TrendingUp,
    Eye,
    MousePointer,
    Package,
    Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RankingItem {
    productId: string;
    score: number;
    impressions: number;
    clicks: number;
    ctr: number;
    updatedAt: string;
    product?: {
        id: string;
        name: string;
        imageUrl?: string;
        isSponsored?: boolean;
        brand?: { name: string };
    };
}

export default function RankingsPage() {
    const [rankings, setRankings] = useState<RankingItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRecalculating, setIsRecalculating] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("adminToken");
            if (!token) return;

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
            const res = await fetch(`${apiUrl}/admin/products/rankings?limit=50`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setRankings(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRecalculate = async () => {
        if (!confirm("ยืนยันการคำนวณ Ranking ใหม่? อาจใช้เวลาสักครู่")) return;

        try {
            setIsRecalculating(true);
            const token = localStorage.getItem("adminToken");
            if (!token) return;

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
            const res = await fetch(`${apiUrl}/admin/products/recalculate-ranks`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                alert("คำนวณ Ranking ใหม่เรียบร้อย!");
                fetchData();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsRecalculating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-farm-green-600" />
            </div>
        );
    }

    // Top 3 Products
    const top3 = rankings.slice(0, 3);
    // const rest = rankings.slice(3);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Product Rankings</h1>
                    <p className="text-gray-500">อันดับสินค้าตาม AI Score + Ads Performance</p>
                </div>
                <Button onClick={handleRecalculate} disabled={isRecalculating}>
                    {isRecalculating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    คำนวณใหม่
                </Button>
            </div>

            {/* Top 3 */}
            {top3.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {top3.map((item, idx) => {
                        const medals = ["🥇", "🥈", "🥉"];
                        const bgColors = ["bg-yellow-50 border-yellow-300", "bg-gray-50 border-gray-300", "bg-orange-50 border-orange-300"];
                        return (
                            <Card key={item.productId} className={`border-2 ${bgColors[idx]}`}>
                                <CardContent className="p-4">
                                    <div className="text-center">
                                        <span className="text-4xl">{medals[idx]}</span>
                                        <h3 className="font-bold text-lg mt-2 flex items-center justify-center gap-1">
                                            {item.product?.name}
                                            {item.product?.isSponsored && (
                                                <Sparkles className="w-4 h-4 text-purple-500" />
                                            )}
                                        </h3>
                                        {item.product?.brand?.name && (
                                            <p className="text-sm text-gray-500">{item.product.brand.name}</p>
                                        )}
                                        <div className="mt-4 text-3xl font-bold text-farm-green-600">
                                            {item.score.toFixed(2)}
                                        </div>
                                        <p className="text-sm text-gray-500">Score</p>
                                        <div className="mt-3 flex justify-center gap-4 text-sm">
                                            <div className="flex items-center gap-1">
                                                <Eye className="w-4 h-4 text-blue-500" />
                                                {item.impressions.toLocaleString()}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MousePointer className="w-4 h-4 text-green-500" />
                                                {item.clicks.toLocaleString()}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <TrendingUp className="w-4 h-4 text-purple-500" />
                                                {(item.ctr * 100).toFixed(2)}%
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Rest of Rankings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        All Rankings ({rankings.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {rankings.length === 0 ? (
                        <div className="text-center py-8">
                            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">ยังไม่มีข้อมูล Ranking</p>
                            <Button className="mt-4" onClick={handleRecalculate}>
                                คำนวณ Ranking
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-2 w-12">#</th>
                                        <th className="text-left py-3 px-2">สินค้า</th>
                                        <th className="text-right py-3 px-2">Score</th>
                                        <th className="text-right py-3 px-2">Impressions</th>
                                        <th className="text-right py-3 px-2">Clicks</th>
                                        <th className="text-right py-3 px-2">CTR</th>
                                        <th className="text-right py-3 px-2">Updated</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rankings.map((item, idx) => (
                                        <tr key={item.productId} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-2 font-bold text-gray-400">
                                                {idx + 1}
                                            </td>
                                            <td className="py-3 px-2">
                                                <div className="flex items-center gap-2">
                                                    <Package className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium">{item.product?.name}</span>
                                                    {item.product?.isSponsored && (
                                                        <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs">
                                                            Sponsored
                                                        </span>
                                                    )}
                                                </div>
                                                {item.product?.brand?.name && (
                                                    <p className="text-sm text-gray-500 ml-6">{item.product.brand.name}</p>
                                                )}
                                            </td>
                                            <td className="py-3 px-2 text-right font-bold text-farm-green-600">
                                                {item.score.toFixed(2)}
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                {item.impressions.toLocaleString()}
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                {item.clicks.toLocaleString()}
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                <span className={`${item.ctr > 0.05 ? "text-green-600" : "text-gray-600"}`}>
                                                    {(item.ctr * 100).toFixed(2)}%
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-right text-sm text-gray-400">
                                                {new Date(item.updatedAt).toLocaleDateString("th-TH")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
