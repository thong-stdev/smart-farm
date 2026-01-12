"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polygon, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Undo2, Check, Map, Satellite } from "lucide-react";
import { Button } from "@/components/ui/button";

// Fix Leaflet default marker icon issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Tile layers
const tileLayers = {
    street: {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
    satellite: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    },
};

// Custom marker icon for polygon points
const pointIcon = new L.DivIcon({
    className: "polygon-point",
    html: `<div style="
        width: 16px; 
        height: 16px; 
        background: #16a34a; 
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

interface Props {
    initialLocation: { lat: number; lng: number };
    onSelect: (polygon: { lat: number; lng: number }[], area: number) => void;
    onBack: () => void;
}

// Component to set initial view (only once)
function SetView({ center }: { center: [number, number] }) {
    const map = useMap();
    const hasSetView = useRef(false);

    useEffect(() => {
        if (!hasSetView.current) {
            map.setView(center, 18);
            hasSetView.current = true;
        }
    }, [center, map]);
    return null;
}

// Component to track map center
function MapCenterTracker({ onCenterChange }: { onCenterChange: (lat: number, lng: number) => void }) {
    const map = useMapEvents({
        moveend: () => {
            const center = map.getCenter();
            onCenterChange(center.lat, center.lng);
        },
    });
    return null;
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }): number {
    const R = 6371000; // Earth radius in meters
    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLon = ((p2.lng - p1.lng) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((p1.lat * Math.PI) / 180) * Math.cos((p2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Calculate polygon area using Shoelace formula
function calculatePolygonArea(points: { lat: number; lng: number }[]): number {
    if (points.length < 3) return 0;

    // Convert to meters (approximate)
    const R = 6371000;
    const toRadians = (deg: number) => (deg * Math.PI) / 180;

    // Calculate area using Shoelace formula with earth radius
    let area = 0;
    const n = points.length;

    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const lat1 = toRadians(points[i].lat);
        const lat2 = toRadians(points[j].lat);
        const lon1 = toRadians(points[i].lng);
        const lon2 = toRadians(points[j].lng);

        area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }

    area = Math.abs((area * R * R) / 2);

    // Convert to ไร่ (1 ไร่ = 1600 ตร.ม.)
    return area / 1600;
}

export default function AreaMeasure({ initialLocation, onSelect, onBack }: Props) {
    const [center, setCenter] = useState(initialLocation);
    const [points, setPoints] = useState<{ lat: number; lng: number }[]>([]);
    const [area, setArea] = useState(0);
    const [mapType, setMapType] = useState<"street" | "satellite">("satellite");

    // Recalculate area when points change
    useEffect(() => {
        if (points.length >= 3) {
            setArea(calculatePolygonArea(points));
        } else {
            setArea(0);
        }
    }, [points]);

    const handleAddPoint = () => {
        const newPoints = [...points, { lat: center.lat, lng: center.lng }];
        setPoints(newPoints);
    };

    const handleUndo = () => {
        if (points.length > 0) {
            setPoints(points.slice(0, -1));
        }
    };

    const handleConfirm = () => {
        if (points.length >= 3) {
            onSelect(points, area);
        }
    };

    // Generate distance labels for each edge
    const getDistanceLabels = () => {
        if (points.length < 2) return [];
        const labels = [];
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            if (j === 0 && points.length < 3) continue;
            const distance = calculateDistance(points[i], points[j]);
            const midLat = (points[i].lat + points[j].lat) / 2;
            const midLng = (points[i].lng + points[j].lng) / 2;
            labels.push({
                position: { lat: midLat, lng: midLng },
                distance: distance < 1000 ? `${distance.toFixed(0)} ม.` : `${(distance / 1000).toFixed(2)} กม.`,
            });
        }
        return labels;
    };

    const distanceLabels = getDistanceLabels();

    return (
        <div className="relative h-[70vh]">
            <MapContainer
                center={[initialLocation.lat, initialLocation.lng]}
                zoom={18}
                className="h-full w-full z-0"
            >
                <TileLayer
                    key={mapType}
                    attribution={tileLayers[mapType].attribution}
                    url={tileLayers[mapType].url}
                />

                <SetView center={[initialLocation.lat, initialLocation.lng]} />
                <MapCenterTracker onCenterChange={(lat, lng) => setCenter({ lat, lng })} />

                {/* Polygon points */}
                {points.map((point, index) => (
                    <Marker key={index} position={[point.lat, point.lng]} icon={pointIcon} />
                ))}

                {/* Polygon fill */}
                {points.length >= 3 && (
                    <Polygon
                        positions={points.map(p => [p.lat, p.lng] as [number, number])}
                        pathOptions={{ color: "#16a34a", fillColor: "#22c55e", fillOpacity: 0.3, weight: 3 }}
                    />
                )}

                {/* Lines between points */}
                {points.length >= 2 && (
                    <Polyline
                        positions={[...points, points[0]].map(p => [p.lat, p.lng] as [number, number])}
                        pathOptions={{ color: "#16a34a", weight: 3, dashArray: points.length < 3 ? "10, 10" : undefined }}
                    />
                )}

                {/* Distance labels */}
                {distanceLabels.map((label, index) => (
                    <Marker
                        key={`label-${index}`}
                        position={[label.position.lat, label.position.lng]}
                        icon={new L.DivIcon({
                            className: "distance-label",
                            html: `<div style="
                                background: white;
                                padding: 4px 8px;
                                border-radius: 6px;
                                font-size: 12px;
                                font-weight: 700;
                                color: #15803d;
                                white-space: nowrap;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                                border: 2px solid #22c55e;
                                transform: translate(-50%, -50%);
                            ">${label.distance}</div>`,
                            iconSize: [80, 30],
                            iconAnchor: [40, 15],
                        })}
                    />
                ))}
            </MapContainer>

            {/* Center Pin */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[1000] pointer-events-none">
                <div className="relative">
                    <MapPin className="w-10 h-10 text-red-500 drop-shadow-lg" fill="#ef4444" />
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full shadow-lg" />
                </div>
            </div>

            {/* Map Type Toggle */}
            <div className="absolute top-4 right-4 z-[1000]">
                <div className="bg-white rounded-lg shadow-lg p-1 flex gap-1">
                    <button
                        onClick={() => setMapType("street")}
                        className={`p-2 rounded ${mapType === "street" ? "bg-farm-green-100 text-farm-green-700" : "text-gray-500 hover:bg-gray-100"}`}
                        title="แผนที่"
                    >
                        <Map className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setMapType("satellite")}
                        className={`p-2 rounded ${mapType === "satellite" ? "bg-farm-green-100 text-farm-green-700" : "text-gray-500 hover:bg-gray-100"}`}
                        title="ภาพถ่าย"
                    >
                        <Satellite className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Info Panel */}
            <div className="absolute top-4 left-4 right-4 z-[1000]">
                <div className="bg-white rounded-xl shadow-lg p-4 max-w-md mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">จุดที่มาร์ค: {points.length}</p>
                            {points.length >= 3 && (
                                <p className="text-lg font-bold text-farm-green-600">
                                    พื้นที่: {area.toFixed(2)} ไร่
                                </p>
                            )}
                            {points.length < 3 && (
                                <p className="text-sm text-gray-400">มาร์คอย่างน้อย 3 จุด</p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleUndo}
                                disabled={points.length === 0}
                            >
                                <Undo2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Panel */}
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4 z-[1000]">
                <div className="max-w-lg mx-auto space-y-3">
                    <p className="text-xs text-center text-gray-400">
                        เลื่อนแผนที่ให้หมุดอยู่ที่มุมแปลง แล้วกด &quot;มาร์คจุด&quot;
                    </p>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onBack} className="flex-1">
                            ย้อนกลับ
                        </Button>
                        <Button onClick={handleAddPoint} variant="secondary" className="flex-1">
                            <MapPin className="w-4 h-4 mr-2" />
                            มาร์คจุด
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={points.length < 3}
                            className="flex-1"
                        >
                            <Check className="w-4 h-4 mr-2" />
                            ยืนยัน
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
