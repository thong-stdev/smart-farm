"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Loader2, Plus, Edit, Trash2, X, ChevronDown, ChevronUp, Layers, Sprout } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface CropVariety {
    id: string;
    name: string;
    cropType: { name: string };
}

interface PlanStage {
    id: string;
    stageName: string;
    dayStart: number;
    dayEnd: number | null;
    action: string;
    method: string;
    reason: string;
}

interface CropPlan {
    id: string;
    name: string;
    description: string | null;
    stageCount: number;
    cycleCount: number;
    varieties?: CropVariety[];
    stages?: PlanStage[];
}

export default function AdminCropPlansPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [plans, setPlans] = useState<CropPlan[]>([]);
    const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
    const [planDetails, setPlanDetails] = useState<Record<string, CropPlan>>({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [cropTypes, setCropTypes] = useState<any[]>([]);

    // Modal states
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [showStageModal, setShowStageModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<CropPlan | null>(null);
    const [editingStage, setEditingStage] = useState<PlanStage | null>(null);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

    // Form states
    const [planName, setPlanName] = useState("");
    const [planDescription, setPlanDescription] = useState("");
    const [selectedVarietyIds, setSelectedVarietyIds] = useState<string[]>([]);
    const [stageForm, setStageForm] = useState({
        stageName: "",
        dayStart: "",
        dayEnd: "",
        action: "",
        method: "",
        reason: "",
    });
    const [isSaving, setIsSaving] = useState(false);

    const fetchPlans = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/crop-plans`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) setPlans(await res.json());
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchCropTypes = useCallback(async () => {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${API_URL}/admin/crop-types`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) setCropTypes(await res.json());
    }, []);

    const fetchPlanDetails = async (planId: string) => {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${API_URL}/crop-plans/${planId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
            const data = await res.json();
            setPlanDetails(prev => ({ ...prev, [planId]: data }));
        }
    };

    useEffect(() => {
        fetchPlans();
        fetchCropTypes();
    }, [fetchPlans, fetchCropTypes]);

    const handleExpandPlan = async (planId: string) => {
        if (expandedPlan === planId) {
            setExpandedPlan(null);
        } else {
            setExpandedPlan(planId);
            if (!planDetails[planId]) {
                await fetchPlanDetails(planId);
            }
        }
    };

    const openPlanModal = (plan?: CropPlan) => {
        if (plan) {
            setEditingPlan(plan);
            setPlanName(plan.name);
            setPlanDescription(plan.description || "");
            // Load varieties from details if available
            if (planDetails[plan.id]?.varieties) {
                setSelectedVarietyIds(planDetails[plan.id].varieties!.map(v => v.id));
            } else {
                setSelectedVarietyIds([]);
            }
        } else {
            setEditingPlan(null);
            setPlanName("");
            setPlanDescription("");
            setSelectedVarietyIds([]);
        }
        setShowPlanModal(true);
    };

    const handleSavePlan = async () => {
        if (!planName.trim()) return;
        setIsSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const method = editingPlan ? 'PATCH' : 'POST';
            const url = editingPlan
                ? `${API_URL}/crop-plans/${editingPlan.id}`
                : `${API_URL}/crop-plans`;

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: planName,
                    description: planDescription || null,
                    varietyIds: selectedVarietyIds.length > 0 ? selectedVarietyIds : undefined,
                }),
            });

            if (res.ok) {
                setShowPlanModal(false);
                setPlanName("");
                setPlanDescription("");
                setSelectedVarietyIds([]);
                setEditingPlan(null);
                fetchPlans();
            }
        } catch (err) {
            console.error('Save failed:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveStage = async () => {
        if (!stageForm.stageName.trim() || !selectedPlanId) return;
        setIsSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const method = editingStage ? 'PATCH' : 'POST';
            const url = editingStage
                ? `${API_URL}/crop-plans/stages/${editingStage.id}`
                : `${API_URL}/crop-plans/${selectedPlanId}/stages`;

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    stageName: stageForm.stageName,
                    dayStart: parseInt(stageForm.dayStart) || 0,
                    dayEnd: stageForm.dayEnd ? parseInt(stageForm.dayEnd) : null,
                    action: stageForm.action,
                    method: stageForm.method,
                    reason: stageForm.reason,
                }),
            });

            if (res.ok) {
                setShowStageModal(false);
                setStageForm({ stageName: "", dayStart: "", dayEnd: "", action: "", method: "", reason: "" });
                setEditingStage(null);
                fetchPlanDetails(selectedPlanId);
                fetchPlans();
            }
        } catch (err) {
            console.error('Save failed:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeletePlan = async (id: string) => {
        if (!confirm('ต้องการลบแผนการปลูกนี้?')) return;
        const token = localStorage.getItem('adminToken');
        await fetch(`${API_URL}/crop-plans/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        fetchPlans();
    };

    const handleDeleteStage = async (stageId: string, planId: string) => {
        if (!confirm('ต้องการลบขั้นตอนนี้?')) return;
        const token = localStorage.getItem('adminToken');
        await fetch(`${API_URL}/crop-plans/stages/${stageId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        fetchPlanDetails(planId);
        fetchPlans();
    };

    const toggleVariety = (varietyId: string) => {
        setSelectedVarietyIds(prev =>
            prev.includes(varietyId)
                ? prev.filter(id => id !== varietyId)
                : [...prev, varietyId]
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">แผนการปลูก</h1>
                    <p className="text-gray-500">จัดการแผนและขั้นตอนการปลูก</p>
                </div>
                <Button onClick={() => openPlanModal()}>
                    <Plus className="w-4 h-4 mr-2" />
                    สร้างแผนใหม่
                </Button>
            </div>

            {/* Plans List */}
            <div className="space-y-4">
                {plans.map((plan) => (
                    <Card key={plan.id}>
                        <CardHeader className="cursor-pointer" onClick={() => handleExpandPlan(plan.id)}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Calendar className="w-5 h-5 text-purple-600" />
                                        {plan.name}
                                        <span className="text-sm font-normal text-gray-400">
                                            ({plan.stageCount} ขั้นตอน, {plan.cycleCount} รอบปลูก)
                                        </span>
                                    </CardTitle>
                                    {/* แสดงพันธุ์พืชที่เกี่ยวข้อง */}
                                    {plan.varieties && plan.varieties.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {plan.varieties.map(v => (
                                                <span key={v.id} className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                                                    {v.cropType?.name}: {v.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openPlanModal(plan); }}>
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id); }}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                    {expandedPlan === plan.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                            </div>
                            {plan.description && (
                                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                            )}
                        </CardHeader>
                        {expandedPlan === plan.id && planDetails[plan.id] && (
                            <CardContent className="pt-0">
                                <div className="border-t pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-gray-700 flex items-center gap-2">
                                            <Layers className="w-4 h-4" />
                                            ขั้นตอนการปลูก
                                        </h4>
                                        <Button size="sm" variant="outline" onClick={() => { setSelectedPlanId(plan.id); setEditingStage(null); setStageForm({ stageName: "", dayStart: "", dayEnd: "", action: "", method: "", reason: "" }); setShowStageModal(true); }}>
                                            <Plus className="w-3 h-3 mr-1" />
                                            เพิ่มขั้นตอน
                                        </Button>
                                    </div>
                                    {(!planDetails[plan.id].stages || planDetails[plan.id].stages!.length === 0) ? (
                                        <p className="text-sm text-gray-400">ยังไม่มีขั้นตอน</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {planDetails[plan.id].stages!.map((stage, idx) => (
                                                <div key={stage.id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-purple-500">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center">{idx + 1}</span>
                                                                <span className="font-medium">{stage.stageName}</span>
                                                                <span className="text-xs text-gray-400">
                                                                    (วันที่ {stage.dayStart}{stage.dayEnd ? ` - ${stage.dayEnd}` : ''})
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 mt-1 ml-8"><strong>กิจกรรม:</strong> {stage.action}</p>
                                                            <p className="text-sm text-gray-600 ml-8"><strong>วิธีการ:</strong> {stage.method}</p>
                                                            <p className="text-sm text-gray-500 ml-8"><strong>เหตุผล:</strong> {stage.reason}</p>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <Button variant="ghost" size="sm" onClick={() => { setSelectedPlanId(plan.id); setEditingStage(stage); setStageForm({ stageName: stage.stageName, dayStart: stage.dayStart.toString(), dayEnd: stage.dayEnd?.toString() || "", action: stage.action, method: stage.method, reason: stage.reason }); setShowStageModal(true); }}>
                                                                <Edit className="w-3 h-3" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteStage(stage.id, plan.id)}>
                                                                <Trash2 className="w-3 h-3 text-red-500" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        )}
                    </Card>
                ))}
                {plans.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>ยังไม่มีแผนการปลูก</p>
                    </div>
                )}
            </div>

            {/* Modal: Add/Edit Plan */}
            {showPlanModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">{editingPlan ? 'แก้ไขแผน' : 'สร้างแผนใหม่'}</h3>
                            <button onClick={() => setShowPlanModal(false)}><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label>ชื่อแผน *</Label>
                                <Input value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="เช่น แผนปลูกข้าวนาปี" />
                            </div>
                            <div>
                                <Label>รายละเอียด</Label>
                                <textarea className="w-full p-2 border rounded-lg h-20" value={planDescription} onChange={(e) => setPlanDescription(e.target.value)} placeholder="รายละเอียดแผน..." />
                            </div>

                            {/* เลือกพันธุ์พืช */}
                            <div>
                                <Label className="flex items-center gap-2 mb-2">
                                    <Sprout className="w-4 h-4 text-green-600" />
                                    พันธุ์พืชที่ใช้กับแผนนี้
                                </Label>
                                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                                    {cropTypes.length === 0 ? (
                                        <p className="text-sm text-gray-400">ไม่มีพันธุ์พืช</p>
                                    ) : (
                                        cropTypes.map((ct) => (
                                            <div key={ct.id}>
                                                <p className="text-sm font-medium text-gray-700 mb-1">{ct.name}</p>
                                                <div className="flex flex-wrap gap-2 ml-2">
                                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                    {ct.varieties?.map((v: any) => (
                                                        <label key={v.id} className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-sm ${selectedVarietyIds.includes(v.id) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={selectedVarietyIds.includes(v.id)}
                                                                onChange={() => toggleVariety(v.id)}
                                                            />
                                                            {v.name}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {selectedVarietyIds.length > 0 && (
                                    <p className="text-xs text-green-600 mt-1">เลือก {selectedVarietyIds.length} พันธุ์</p>
                                )}
                            </div>

                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setShowPlanModal(false)}>ยกเลิก</Button>
                                <Button onClick={handleSavePlan} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'บันทึก'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Add/Edit Stage */}
            {showStageModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">{editingStage ? 'แก้ไขขั้นตอน' : 'เพิ่มขั้นตอน'}</h3>
                            <button onClick={() => setShowStageModal(false)}><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label>ชื่อขั้นตอน</Label>
                                <Input value={stageForm.stageName} onChange={(e) => setStageForm({ ...stageForm, stageName: e.target.value })} placeholder="เช่น เตรียมดิน" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>วันเริ่มต้น</Label>
                                    <Input type="number" value={stageForm.dayStart} onChange={(e) => setStageForm({ ...stageForm, dayStart: e.target.value })} placeholder="0" />
                                </div>
                                <div>
                                    <Label>วันสิ้นสุด</Label>
                                    <Input type="number" value={stageForm.dayEnd} onChange={(e) => setStageForm({ ...stageForm, dayEnd: e.target.value })} placeholder="7" />
                                </div>
                            </div>
                            <div>
                                <Label>กิจกรรม</Label>
                                <Input value={stageForm.action} onChange={(e) => setStageForm({ ...stageForm, action: e.target.value })} placeholder="เช่น ไถพรวน หว่านปุ๋ย" />
                            </div>
                            <div>
                                <Label>วิธีการ</Label>
                                <Input value={stageForm.method} onChange={(e) => setStageForm({ ...stageForm, method: e.target.value })} placeholder="เช่น ใช้รถไถเดินตาม" />
                            </div>
                            <div>
                                <Label>เหตุผล</Label>
                                <Input value={stageForm.reason} onChange={(e) => setStageForm({ ...stageForm, reason: e.target.value })} placeholder="เช่น ทำให้ดินร่วนซุย" />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setShowStageModal(false)}>ยกเลิก</Button>
                                <Button onClick={handleSaveStage} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'บันทึก'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
