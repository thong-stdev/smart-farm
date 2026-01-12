"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface AddActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    plotId: string;
    cropCycleId: string;
}


export default function AddActivityModal({ isOpen, onClose, onSuccess, plotId, cropCycleId }: AddActivityModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("EXPENSE");
    const [hasPlanting, setHasPlanting] = useState(false);

    // Form States
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [quantity, setQuantity] = useState("");
    const [unit, setUnit] = useState("");

    // Planting Specific
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [cropTypes, setCropTypes] = useState<any[]>([]);
    const [selectedType, setSelectedType] = useState("");
    const [selectedVariety, setSelectedVariety] = useState("");

    // Fetch cycle info to check hasPlanting
    useEffect(() => {
        if (isOpen && cropCycleId) {
            const token = localStorage.getItem("accessToken");
            // Check planting status
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/crop-cycles/${cropCycleId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    setHasPlanting(data.hasPlanting);
                    // Also pre-fill crop info if available
                    if (data.cropVarietyId) setSelectedVariety(data.cropVarietyId);
                })
                .catch(console.error);

            // Fetch crop types for planting form
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/crop-types`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setCropTypes(data.cropTypes || data))
                .catch(console.error);
        }
    }, [isOpen, cropCycleId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            const token = localStorage.getItem("accessToken");

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const payload: any = {
                type: activeTab,
                plotId,
                cropCycleId,
                date: new Date(date),
                description,
            };

            if (activeTab === 'EXPENSE' || activeTab === 'INCOME') {
                payload.amount = parseFloat(amount || "0");
                payload.quantity = parseFloat(quantity || "0");
                payload.unit = unit;
            }

            if (activeTab === 'PLANTING') {
                // If planting, we might want to update the crop cycle's variety too handled by backend? 
                // Currently backend doesn't update variety automatically from activity, 
                // but we can send a separate request OR enhance backend. 
                // For now, let's just create the activity. 
                // Wait, user requirement said "choose crop type/variety" here too.
                // We should probably update the cycle as well if it was empty.
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/activities`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                // If PLANTING and variety selected, also update cycle
                if (activeTab === 'PLANTING' && selectedVariety) {
                    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/crop-cycles/${cropCycleId}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({ cropVarietyId: selectedVariety })
                    });
                }

                onSuccess();
                onClose();
                resetForm();
            } else {
                const error = await res.json();
                alert(error.message || "Failed to create activity");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setDescription("");
        setAmount("");
        setQuantity("");
        setUnit("");
        setActiveTab("EXPENSE");
    };

    const selectedTypeData = cropTypes.find(t => t.id === selectedType);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>บันทึกกิจกรรม</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="EXPENSE">รายจ่าย</TabsTrigger>
                        <TabsTrigger value="INCOME">รายรับ</TabsTrigger>
                        <TabsTrigger value="GENERAL">ทั่วไป</TabsTrigger>
                        {!hasPlanting && <TabsTrigger value="PLANTING">ปลูก</TabsTrigger>}
                    </TabsList>

                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>วันที่</Label>
                            <Input
                                type="date"
                                required
                                value={date}
                                onChange={e => setDate(e.target.value)}
                            />
                        </div>

                        {/* EXPENSE & INCOME Fields */}
                        {(activeTab === 'EXPENSE' || activeTab === 'INCOME') && (
                            <>
                                <div className="space-y-2">
                                    <Label>จำนวนเงิน (บาท) <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>จำนวนสินค้า</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={quantity}
                                            onChange={e => setQuantity(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>หน่วยนับ</Label>
                                        <Input
                                            value={unit}
                                            onChange={e => setUnit(e.target.value)}
                                            placeholder="เช่น ขวด, ถุง, กก."
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* PLANTING Fields */}
                        {activeTab === 'PLANTING' && (
                            <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg border border-green-100">
                                <div className="space-y-2">
                                    <Label>เลือกพืช</Label>
                                    <Select value={selectedType} onValueChange={setSelectedType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="ประเภทพืช" />
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
                                    <Label>พันธุ์</Label>
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
                        )}

                        <div className="space-y-2">
                            <Label>รายละเอียด {activeTab === 'PLANTING' && '(เช่น วิธีการปลูก, ระยะห่าง)'}</Label>
                            <Textarea
                                required={activeTab === 'GENERAL'}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="รายละเอียดเพิ่มเติม..."
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                                ยกเลิก
                            </Button>
                            <Button type="submit" disabled={isLoading} className={
                                activeTab === 'INCOME' ? 'bg-green-600 hover:bg-green-700' :
                                    activeTab === 'EXPENSE' ? 'bg-red-600 hover:bg-red-700' :
                                        activeTab === 'PLANTING' ? 'bg-farm-green-600 hover:bg-farm-green-700' :
                                            'bg-blue-600 hover:bg-blue-700'
                            }>
                                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                บันทึก
                            </Button>
                        </DialogFooter>
                    </form>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
