"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sprout, Plus, Loader2, Calendar, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/services/api";
import { CropCycle } from "@/types";
import { formatDate } from "@/lib/utils";

export default function CropCyclesPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [cropCycles, setCropCycles] = useState<CropCycle[]>([]);

    useEffect(() => {
        fetchCropCycles();
    }, []);

    const fetchCropCycles = async () => {
        try {
            // ดึงจากทุกแปลง
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const plots = await api.get<any[]>('/plots');
            const allCycles: CropCycle[] = [];

            for (const plot of plots) {
                const cycles = await api.get<CropCycle[]>(`/crop-cycles/plot/${plot.id}`);
                allCycles.push(...cycles.map(c => ({ ...c, plot })));
            }

            setCropCycles(allCycles.sort((a, b) =>
                new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
            ));
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-farm-green-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">รอบการปลูก</h1>
                    <p className="text-gray-500">จัดการรอบการปลูกทั้งหมด</p>
                </div>
            </div>

            {cropCycles.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Sprout className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีรอบการปลูก</h3>
                        <p className="text-gray-500 mb-4">สร้างแปลงก่อน แล้วเริ่มรอบการปลูก</p>
                        <Link href="/web/plots">
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                ไปหน้าแปลงเกษตร
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {cropCycles.map((cycle) => (
                        <Card key={cycle.id} className="card-hover">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cycle.status === 'ACTIVE' ? 'bg-farm-green-100' : 'bg-gray-100'
                                        }`}>
                                        {cycle.status === 'ACTIVE' ? (
                                            <Sprout className="w-6 h-6 text-farm-green-600" />
                                        ) : (
                                            <CheckCircle className="w-6 h-6 text-gray-600" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900">
                                                {cycle.cropType || 'ไม่ระบุพืช'}
                                            </h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${cycle.status === 'ACTIVE'
                                                ? 'bg-farm-green-100 text-farm-green-700'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {cycle.status === 'ACTIVE' ? 'กำลังปลูก' : 'เสร็จสิ้น'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            แปลง: {cycle.plot?.name}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                เริ่ม: {formatDate(cycle.startDate)}
                                            </span>
                                            {cycle.endDate && (
                                                <span>จบ: {formatDate(cycle.endDate)}</span>
                                            )}
                                            {cycle.yield && (
                                                <span>ผลผลิต: {cycle.yield} กก.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
