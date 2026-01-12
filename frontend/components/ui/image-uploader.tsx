"use client";

import { useState, useRef } from "react";
import { Camera, X, Image as ImageIcon, Loader2 } from "lucide-react";


interface ImageUploaderProps {
    images: string[];
    onChange: (images: string[]) => void;
    maxImages?: number;
    disabled?: boolean;
}

export default function ImageUploader({
    images,
    onChange,
    maxImages = 5,
    disabled = false
}: ImageUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        try {
            const newImages: string[] = [];

            for (let i = 0; i < files.length && images.length + newImages.length < maxImages; i++) {
                const file = files[i];

                // Validate file type
                if (!file.type.startsWith('image/')) continue;

                // Convert to base64
                const base64 = await fileToBase64(file);

                // Upload to backend
                const token = localStorage.getItem("accessToken");
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/upload/base64`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        image: base64,
                        folder: 'activities'
                    }),
                });

                if (res.ok) {
                    const data = await res.json();
                    newImages.push(data.url);
                }
            }

            if (newImages.length > 0) {
                onChange([...images, ...newImages]);
            }
        } catch (error) {
            console.error("Upload error:", error);
        } finally {
            setIsUploading(false);
            // Reset inputs
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (cameraInputRef.current) cameraInputRef.current.value = '';
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
        });
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        onChange(newImages);
    };

    const canAddMore = images.length < maxImages && !disabled;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                    รูปภาพ ({images.length}/{maxImages})
                </label>
                {isUploading && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        กำลังอัพโหลด...
                    </div>
                )}
            </div>

            <div className="grid grid-cols-4 gap-2">
                {/* Existing Images */}
                {images.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${url}`}
                            alt={`Image ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                        {!disabled && (
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ))}

                {/* Add Buttons */}
                {canAddMore && (
                    <>
                        {/* Camera Button */}
                        <button
                            type="button"
                            onClick={() => cameraInputRef.current?.click()}
                            disabled={isUploading}
                            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 hover:border-farm-green-500 hover:bg-farm-green-50 transition disabled:opacity-50"
                        >
                            <Camera className="w-6 h-6 text-gray-400" />
                            <span className="text-xs text-gray-500">ถ่ายรูป</span>
                        </button>

                        {/* Gallery Button */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 hover:border-farm-green-500 hover:bg-farm-green-50 transition disabled:opacity-50"
                        >
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                            <span className="text-xs text-gray-500">เลือกรูป</span>
                        </button>
                    </>
                )}
            </div>

            {/* Hidden Inputs */}
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
            />
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>
    );
}
