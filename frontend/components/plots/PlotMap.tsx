"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface PlotMapProps {
    lat: number;
    lng: number;
    polygon?: { lat: number; lng: number }[];
    readOnly?: boolean;
}

export default function PlotMap({ lat, lng, polygon, readOnly = true }: PlotMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        const map = L.map(mapRef.current, {
            zoomControl: !readOnly,
            dragging: !readOnly,
            scrollWheelZoom: !readOnly,
        }).setView([lat, lng], 16);

        L.tileLayer("https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}", {
            maxZoom: 20,
            subdomains: ["mt0", "mt1", "mt2", "mt3"],
        }).addTo(map);

        // Add marker
        const customIcon = L.divIcon({
            html: `<div class="w-8 h-8 bg-farm-green-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                </svg>
            </div>`,
            className: "",
            iconSize: [32, 32],
            iconAnchor: [16, 32],
        });

        L.marker([lat, lng], { icon: customIcon }).addTo(map);

        // Add polygon if exists
        if (polygon && polygon.length > 0) {
            const latlngs = polygon.map(p => [p.lat, p.lng] as [number, number]);
            L.polygon(latlngs, {
                color: "#16a34a",
                fillColor: "#22c55e",
                fillOpacity: 0.3,
                weight: 2,
            }).addTo(map);

            // Fit bounds to polygon
            const bounds = L.latLngBounds(latlngs);
            map.fitBounds(bounds, { padding: [20, 20] });
        }

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [lat, lng, polygon, readOnly]);

    return (
        <div ref={mapRef} className="w-full h-full" style={{ minHeight: "200px" }} />
    );
}
