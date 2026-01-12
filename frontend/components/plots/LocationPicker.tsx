"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polygon, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Loader2, Map, Satellite, Crosshair } from "lucide-react";
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



interface Props {
    onSelect?: (lat: number, lng: number, address: string) => void;
    readOnly?: boolean;
    initialLocation?: { lat: number; lng: number };
    polygon?: { lat: number; lng: number }[];
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

// Component to set initial position (only once)
function SetViewOnLoad({ center }: { center: [number, number] }) {
    const map = useMap();
    const hasSetView = useRef(false);

    useEffect(() => {
        if (!hasSetView.current) {
            map.setView(center, 16);
            hasSetView.current = true;
        }
    }, [center, map]);
    return null;
}

// Component for programmatic map control
function MapController({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
    const map = useMap();
    mapRef.current = map;
    return null;
}

export default function LocationPicker({ onSelect, readOnly, initialLocation, polygon }: Props) {
    const [center, setCenter] = useState<{ lat: number; lng: number }>(
        initialLocation || { lat: 13.7563, lng: 100.5018 } // Bangkok default
    );
    const [isLoading, setIsLoading] = useState(!initialLocation);
    const [isLocating, setIsLocating] = useState(false);
    const [address, setAddress] = useState("");
    const [mapType, setMapType] = useState<"street" | "satellite">("street");
    const mapRef = useRef<L.Map | null>(null);

    // Get current location on mount
    useEffect(() => {
        if (!initialLocation && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCenter({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                    setIsLoading(false);
                },
                () => {
                    setIsLoading(false);
                }
            );
        }
    }, [initialLocation]);

    // Go to current location (user action)
    const goToCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("เบราว์เซอร์ไม่รองรับ GPS");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newCenter = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                setCenter(newCenter);
                if (mapRef.current) {
                    mapRef.current.setView([newCenter.lat, newCenter.lng], 17);
                }
                fetchAddress(newCenter.lat, newCenter.lng);
                setIsLocating(false);
            },
            (error) => {
                console.error("Geolocation error:", error);
                alert("ไม่สามารถหาตำแหน่งได้ กรุณาเปิด GPS");
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Reverse geocoding to get address
    const fetchAddress = async (lat: number, lng: number) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=th`
            );
            const data = await res.json();
            if (data.address) {
                const parts = [];
                if (data.address.village) parts.push(data.address.village);
                if (data.address.subdistrict) parts.push(data.address.subdistrict);
                if (data.address.district || data.address.city) parts.push(data.address.district || data.address.city);
                if (data.address.state) parts.push(data.address.state);
                setAddress(parts.join(", ") || data.display_name);
            }
        } catch {
            setAddress("");
        }
    };

    const handleCenterChange = (lat: number, lng: number) => {
        setCenter({ lat, lng });
        fetchAddress(lat, lng);
    };

    const handleConfirm = () => {
        if (onSelect) {
            onSelect(center.lat, center.lng, address);
        }
    };

    if (isLoading) {
        return (
            <div className="h-[70vh] flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-farm-green-600 mx-auto mb-2" />
                    <p className="text-gray-500">กำลังหาตำแหน่งของคุณ...</p>
                </div>
            </div>
        );
    }


    return (
        <div className={`relative ${readOnly ? "h-full" : "h-[70vh]"}`}>
            <MapContainer
                center={[center.lat, center.lng]}
                zoom={16}
                className="h-full w-full z-0"
                zoomControl={!readOnly}
                dragging={!readOnly}
                scrollWheelZoom={!readOnly}
            >
                <TileLayer
                    key={mapType}
                    attribution={tileLayers[mapType].attribution}
                    url={tileLayers[mapType].url}
                />

                {!readOnly && (
                    <>
                        <SetViewOnLoad center={[center.lat, center.lng]} />
                        <MapCenterTracker onCenterChange={handleCenterChange} />
                        <MapController mapRef={mapRef} />
                    </>
                )}

                {polygon && polygon.length > 2 && (
                    <Polygon
                        positions={polygon.map(p => [p.lat, p.lng] as [number, number])}
                        pathOptions={{ color: "#16a34a", fillColor: "#22c55e", fillOpacity: 0.3 }}
                    />
                )}

                {readOnly && initialLocation && (
                    <Marker position={[initialLocation.lat, initialLocation.lng]} />
                )}
            </MapContainer>

            {/* Map Type Toggle & GPS Button */}
            {!readOnly && (
                <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
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
                    {/* GPS Button */}
                    <button
                        onClick={goToCurrentLocation}
                        disabled={isLocating}
                        className="bg-white rounded-lg shadow-lg p-3 text-farm-green-600 hover:bg-farm-green-50 disabled:opacity-50"
                        title="ตำแหน่งปัจจุบัน"
                    >
                        {isLocating ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Crosshair className="w-5 h-5" />
                        )}
                    </button>
                </div>
            )}

            {/* Center Pin (fixed position) */}
            {!readOnly && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[1000] pointer-events-none">
                    <div className="relative">
                        <MapPin className="w-12 h-12 text-farm-green-600 drop-shadow-lg" fill="#22c55e" />
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-farm-green-600 rounded-full shadow-lg animate-ping" />
                    </div>
                </div>
            )}

            {/* Bottom Panel */}
            {!readOnly && (
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4 z-[1000]">
                    <div className="max-w-lg mx-auto">
                        {address && (
                            <p className="text-sm text-gray-500 mb-3 text-center truncate">
                                📍 {address}
                            </p>
                        )}
                        <p className="text-xs text-center text-gray-400 mb-3">
                            เลื่อนแผนที่ให้หมุดอยู่ตรงตำแหน่งแปลงของคุณ
                        </p>
                        <Button onClick={handleConfirm} className="w-full" size="lg">
                            บันทึกตำแหน่ง
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
