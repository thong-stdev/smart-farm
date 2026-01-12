"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface AddCropCycleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    plotId: string;
}



export default function AddCropCycleModal({ isOpen, onClose, onSuccess, plotId }: AddCropCycleModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [cropTypes, setCropTypes] = useState<any[]>([]);

    // Form
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedType, setSelectedType] = useState("");
    const [selectedVariety, setSelectedVariety] = useState("");
    const [note, setNote] = useState("");

    const fetchCropTypes = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/crop-types`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCropTypes(data.cropTypes || data); // Handle both wrapped and unwrapped response
            }
        } catch (error) {
            console.error("Failed to fetch crop types:", error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchCropTypes();
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            const token = localStorage.getItem("accessToken");

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const payload: any = {
                plotId,
                startDate: new Date(startDate),
                note,
            };

            // Optional fields
            if (selectedType) payload.cropType = cropTypes.find(t => t.id === selectedType)?.name;
            if (selectedVariety) payload.cropVarietyId = selectedVariety;

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/crop-cycles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                onSuccess();
                onClose();
                // Reset form
                setNote("");
                setSelectedType("");
                setSelectedVariety("");
            } else {
                const error = await res.json();
                alert(error.message || "Failed to create crop cycle");
            }
        } catch (error) {
            console.error("Error creating crop cycle:", error);
            alert("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const selectedTypeData = cropTypes.find(t => t.id === selectedType);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>เพิ่มรอบการปลูกใหม่</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>วันที่เริ่มรอบ <span className="text-red-500">*</span></Label>
                        <Input
                            type="date"
                            required
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>ประเภทพืช (ไม่บังคับ)</Label>
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="เลือกประเภท" />
                                </SelectTrigger>
                                <SelectContent>
                                    {cropTypes.map((type) => (
                                        <SelectItem key={type.id} value={type.id}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>พันธุ์พืช (ไม่บังคับ)</Label>
                            <Select
                                value={selectedVariety}
                                onValueChange={setSelectedVariety}
                                disabled={!selectedType}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="เลือกพันธุ์" />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {selectedTypeData?.varieties.map((v: any) => (
                                        <SelectItem key={v.id} value={v.id}>
                                            {v.name} ({v.duration} วัน)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>หมายเหตุ</Label>
                        <Textarea
                            placeholder="บันทึกเพิ่มเติม..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            ยกเลิก
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            บันทึก
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
