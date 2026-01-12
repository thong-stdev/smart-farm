"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Package, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";


// Mock debounce if hook missing, but better to implement manual timeout inside
const useDebounceManual = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

interface Product {
    id: string;
    name: string;
    price?: number;
    unit?: string;
    category?: { name: string };
    brand?: { name: string };
}

interface ProductSelectorProps {
    onSelect: (product: { productId?: string; customProductName?: string; price?: number; unit?: string }) => void;
    defaultValue?: string;
}

export default function ProductSelector({ onSelect, defaultValue = "" }: ProductSelectorProps) {
    const [query, setQuery] = useState(defaultValue);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<Product[]>([]);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Debounce search
    const debouncedQuery = useDebounceManual(query, 500);

    useEffect(() => {
        if (!isOpen) return;
        if (!debouncedQuery) {
            setResults([]);
            return;
        }

        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/products/search?q=${encodeURIComponent(debouncedQuery)}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data);
                }
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, [debouncedQuery, isOpen]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectProduct = (product: Product) => {
        setQuery(product.name);
        setIsOpen(false);
        onSelect({
            productId: product.id,
            price: product.price,
            unit: product.unit
        });
    };

    const handleSelectCustom = () => {
        setIsOpen(false);
        onSelect({
            customProductName: query,
        });
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                    placeholder="ค้นหาสินค้า หรือ พิมพ์ชื่อเอง..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                        // Clear previous selection if user changes text
                        if (e.target.value !== defaultValue) {
                            onSelect({ customProductName: e.target.value }); // Treat as custom while typing
                        }
                    }}
                    onFocus={() => setIsOpen(true)}
                    className="pl-9"
                />
            </div>

            {isOpen && query && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
                    {/* Custom Option */}
                    <div
                        className="p-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 border-b"
                        onClick={handleSelectCustom}
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                            <Plus className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-blue-700">ใช้ชื่อ: &quot;{query}&quot;</p>
                            <p className="text-xs text-gray-500">ระบุเป็นสินค้าเอง (Custom)</p>
                        </div>
                    </div>

                    {/* Loading */}
                    {isLoading && (
                        <div className="p-4 text-center text-gray-500 text-sm flex justify-center items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            กำลังค้นหา...
                        </div>
                    )}

                    {/* Results */}
                    {!isLoading && results.length > 0 && (
                        <div className="py-1">
                            <p className="px-3 py-1 text-xs font-semibold text-gray-400">เลือกจากฐานข้อมูล</p>
                            {results.map((product) => (
                                <div
                                    key={product.id}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3"
                                    onClick={() => handleSelectProduct(product)}
                                >
                                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
                                        <Package className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                                            {product.price && (
                                                <span className="text-xs font-medium text-green-600">฿{product.price}</span>
                                            )}
                                        </div>
                                        <div className="flex gap-2 text-xs text-gray-500">
                                            {product.brand && <span>{product.brand.name}</span>}
                                            {product.unit && <span>• {product.unit}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
