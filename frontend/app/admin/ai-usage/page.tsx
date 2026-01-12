"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Bot,
    Cpu,
    DollarSign,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AiUsageData {
    period: { startDate: string; endDate: string; days: number };
    totals: {
        requests: number;
        totalTokens: number;
        inputTokens: number;
        outputTokens: number;
        costUsd: number;
        avgLatencyMs: number;
        successRate: number;
    };
    byProvider: Array<{
        provider: string;
        requests: number;
        totalTokens: number;
        costUsd: number;
    }>;
}

interface AiLog {
    id: string;
    provider: string;
    model: string;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    costUsd?: number;
    latencyMs?: number;
    success: boolean;
    error?: string;
    createdAt: string;
}

export default function AiUsagePage() {
    const [usage, setUsage] = useState<AiUsageData | null>(null);
    const [logs, setLogs] = useState<AiLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [days, setDays] = useState(30);



    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("adminToken");
            if (!token) return;

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

            const [usageRes, logsRes] = await Promise.all([
                fetch(`${apiUrl}/admin/ai/usage?days=${days}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${apiUrl}/admin/ai/logs?limit=20`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (usageRes.ok) {
                setUsage(await usageRes.json());
            }
            if (logsRes.ok) {
                const data = await logsRes.json();
                setLogs(data.items || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [days]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-farm-green-600" />
            </div>
        );
    }

    const providerColors: Record<string, string> = {
        openai: "bg-green-100 text-green-700",
        gemini: "bg-blue-100 text-blue-700",
        claude: "bg-orange-100 text-orange-700",
        groq: "bg-purple-100 text-purple-700",
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">AI Usage & Cost</h1>
                    <p className="text-gray-500">ติดตามการใช้งานและค่าใช้จ่าย AI</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="px-3 py-2 border rounded-lg"
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                    >
                        <option value={7}>7 วัน</option>
                        <option value={30}>30 วัน</option>
                        <option value={90}>90 วัน</option>
                    </select>
                    <Button variant="outline" onClick={fetchData}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Bot className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Requests</p>
                                <p className="text-xl font-bold">{usage?.totals.requests.toLocaleString() || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Cpu className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Tokens</p>
                                <p className="text-xl font-bold">{usage?.totals.totalTokens.toLocaleString() || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Cost (USD)</p>
                                <p className="text-xl font-bold">${usage?.totals.costUsd.toFixed(4) || "0.0000"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                <Clock className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Avg Latency</p>
                                <p className="text-xl font-bold">{usage?.totals.avgLatencyMs || 0}ms</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Success Rate */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Success Rate</span>
                        <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500"
                                    style={{ width: `${usage?.totals.successRate || 0}%` }}
                                />
                            </div>
                            <span className="font-medium">{usage?.totals.successRate.toFixed(1) || 0}%</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* By Provider */}
            <Card>
                <CardHeader>
                    <CardTitle>Usage by Provider</CardTitle>
                </CardHeader>
                <CardContent>
                    {!usage?.byProvider.length ? (
                        <p className="text-center py-4 text-gray-500">ยังไม่มีข้อมูล</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {usage.byProvider.map((p) => (
                                <div key={p.provider} className="p-4 border rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-1 rounded text-sm font-medium ${providerColors[p.provider] || "bg-gray-100 text-gray-700"}`}>
                                            {p.provider}
                                        </span>
                                    </div>
                                    <p className="text-2xl font-bold">{p.requests.toLocaleString()}</p>
                                    <p className="text-sm text-gray-500">requests</p>
                                    <div className="mt-2 text-sm">
                                        <span className="text-gray-500">Tokens: </span>
                                        <span className="font-medium">{p.totalTokens.toLocaleString()}</span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-gray-500">Cost: </span>
                                        <span className="font-medium text-green-600">${p.costUsd.toFixed(4)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Logs */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    {logs.length === 0 ? (
                        <p className="text-center py-8 text-gray-500">ยังไม่มี logs</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2 px-2">เวลา</th>
                                        <th className="text-left py-2 px-2">Provider</th>
                                        <th className="text-left py-2 px-2">Model</th>
                                        <th className="text-right py-2 px-2">Tokens</th>
                                        <th className="text-right py-2 px-2">Cost</th>
                                        <th className="text-right py-2 px-2">Latency</th>
                                        <th className="text-center py-2 px-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr key={log.id} className="border-b hover:bg-gray-50">
                                            <td className="py-2 px-2">
                                                {new Date(log.createdAt).toLocaleString("th-TH")}
                                            </td>
                                            <td className="py-2 px-2">
                                                <span className={`px-2 py-0.5 rounded text-xs ${providerColors[log.provider] || "bg-gray-100"}`}>
                                                    {log.provider}
                                                </span>
                                            </td>
                                            <td className="py-2 px-2 font-mono text-xs">{log.model}</td>
                                            <td className="py-2 px-2 text-right">{log.totalTokens?.toLocaleString() || "-"}</td>
                                            <td className="py-2 px-2 text-right text-green-600">
                                                {log.costUsd ? `$${log.costUsd.toFixed(6)}` : "-"}
                                            </td>
                                            <td className="py-2 px-2 text-right">{log.latencyMs ? `${log.latencyMs}ms` : "-"}</td>
                                            <td className="py-2 px-2 text-center">
                                                {log.success ? (
                                                    <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-red-600 mx-auto" />
                                                )}
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
