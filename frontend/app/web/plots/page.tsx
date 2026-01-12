"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MapPin, Plus, Search, Loader2, Sprout, Cloud, Droplets, Wind, Sun, CloudRain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Plot {
    id: string;
    name: string;
    size: number;
    status: string;
    lat?: number;
    lng?: number;
    address?: string;
    _count: { cropCycles: number; activities: number };
    cropCycles?: {
        id: string;
        cropType: string;
        status: string;
        cropVariety?: { name: string };
    }[];
}

interface WeatherData {
    temp: number;
    humidity: number;
    description: string;
    icon: string;
    windSpeed: number;
    rain?: number;
}

export default function PlotsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [plots, setPlots] = useState<Plot[]>([]);
    const [search, setSearch] = useState("");
    const [weatherData, setWeatherData] = useState<Record<string, WeatherData>>({});




    const fetchWeather = useCallback(async (token: string | null) => {
        if (!token) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/weather/plots`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const result = await res.json();
                if (result.success) {
                    setWeatherData(result.data);
                }
            }
        } catch (err) {
            console.error("Weather fetch error:", err);
        }
    }, []);

    const fetchPlots = useCallback(async () => {
        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/plots`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setPlots(data);
                // Fetch weather after getting plots
                fetchWeather(token);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [fetchWeather]);

    useEffect(() => {
        fetchPlots();
    }, [fetchPlots]);



    const filteredPlots = plots.filter((plot) =>
        plot.name.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case "NORMAL":
                return "bg-green-100 text-green-700";
            case "INACTIVE":
                return "bg-gray-100 text-gray-700";
            case "ARCHIVED":
                return "bg-red-100 text-red-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "NORMAL":
                return "ใช้งาน";
            case "INACTIVE":
                return "หยุดใช้งาน";
            case "ARCHIVED":
                return "เก็บถาวร";
            default:
                return status;
        }
    };

    const getWeatherIcon = (icon: string) => {
        if (icon.includes("01") || icon.includes("02")) return <Sun className="w-5 h-5 text-yellow-500" />;
        if (icon.includes("09") || icon.includes("10")) return <CloudRain className="w-5 h-5 text-blue-500" />;
        return <Cloud className="w-5 h-5 text-gray-400" />;
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">แปลงเกษตร</h1>
                    <p className="text-gray-500">จัดการแปลงเกษตรทั้งหมดของคุณ</p>
                </div>
                <Link href="/web/plots/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        สร้างแปลงใหม่
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    placeholder="ค้นหาแปลง..."
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Plots Grid */}
            {filteredPlots.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {search ? "ไม่พบแปลงที่ค้นหา" : "ยังไม่มีแปลงเกษตร"}
                        </h3>
                        <p className="text-gray-500 mb-4">
                            {search ? "ลองค้นหาด้วยคำอื่น" : "สร้างแปลงแรกของคุณเพื่อเริ่มบันทึกกิจกรรม"}
                        </p>
                        {!search && (
                            <Link href="/web/plots/new">
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    สร้างแปลงแรก
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPlots.map((plot) => {
                        const weather = weatherData[plot.id];
                        return (
                            <Link key={plot.id} href={`/web/plots/${plot.id}`}>
                                <Card className="h-full card-hover cursor-pointer">
                                    <CardContent className="p-5">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-farm-green-100 flex items-center justify-center flex-shrink-0">
                                                <Sprout className="w-6 h-6 text-farm-green-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-gray-900 truncate">{plot.name}</h3>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(plot.status)}`}>
                                                        {getStatusText(plot.status)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mb-3">{plot.size} ไร่</p>

                                                {/* Weather Display */}
                                                {weather && (
                                                    <div className="mb-3 p-2.5 bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg border border-blue-100">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                {getWeatherIcon(weather.icon)}
                                                                <span className="text-lg font-bold text-gray-800">{weather.temp}°C</span>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                                <span className="flex items-center gap-1">
                                                                    <Droplets className="w-3 h-3 text-blue-400" />
                                                                    {weather.humidity}%
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Wind className="w-3 h-3 text-gray-400" />
                                                                    {weather.windSpeed.toFixed(1)} m/s
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1">{weather.description}</p>
                                                    </div>
                                                )}

                                                {/* No location warning */}
                                                {!plot.lat && !weather && (
                                                    <div className="mb-3 p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                                                        <p className="text-xs text-yellow-700 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            ยังไม่ได้กำหนดตำแหน่ง
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Current Crop */}
                                                {plot.cropCycles && plot.cropCycles[0] && plot.cropCycles[0].status === "ACTIVE" && (
                                                    <div className="mb-3 p-2 bg-farm-green-50 rounded-lg">
                                                        <p className="text-xs text-farm-green-700">
                                                            กำลังปลูก: <span className="font-medium">
                                                                {plot.cropCycles[0].cropVariety?.name || plot.cropCycles[0].cropType || "ไม่ระบุ"}
                                                            </span>
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                                    <span>{plot._count.cropCycles} รอบปลูก</span>
                                                    <span>{plot._count.activities} กิจกรรม</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
