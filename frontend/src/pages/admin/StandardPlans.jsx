import { useEffect, useState } from 'react';
import api from '../../api/axios';
import PlanPreview from '../../components/PlanPreview';

export default function StandardPlans() {
    const [plans, setPlans] = useState([]);
    const [varieties, setVarieties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [viewMode, setViewMode] = useState('edit'); // 'edit' or 'preview'
    const [formData, setFormData] = useState({
        cropVarietyId: '',
        planName: '',
        totalDays: '',
        costEstimate: '',
        activities: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [varietiesRes, plansRes] = await Promise.all([
                api.get('/public/crop-varieties'),
                api.get('/public/standard-plans')
            ]);

            if (varietiesRes.data.success) {
                setVarieties(varietiesRes.data.varieties);
            }

            if (plansRes.data.success) {
                setPlans(plansRes.data.plans);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingPlan(null);
        setViewMode('edit');
        setFormData({
            cropVarietyId: '',
            planName: '',
            totalDays: '',
            costEstimate: '',
            activities: [{
                day: 1,
                activityName: '',
                description: '',
                estimatedCost: 0
            }]
        });
        setShowDialog(true);
    };

    const handleEdit = (plan) => {
        setEditingPlan(plan);
        setViewMode('edit');

        let activities = [];
        try {
            activities = typeof plan.planDetails === 'string'
                ? JSON.parse(plan.planDetails)
                : plan.planDetails;
        } catch (err) {
            activities = [];
        }

        setFormData({
            cropVarietyId: plan.cropVarietyId,
            planName: plan.planName,
            totalDays: plan.totalDays?.toString() || '',
            costEstimate: plan.costEstimate?.toString() || '',
            activities: activities.length > 0 ? activities : [{
                day: 1,
                activityName: '',
                description: '',
                estimatedCost: 0
            }]
        });
        setShowDialog(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!formData.activities || formData.activities.length === 0) {
                alert('กรุณาเพิ่มขั้นตอนอย่างน้อย 1 ขั้นตอน');
                return;
            }

            const sortedActivities = [...formData.activities].sort((a, b) => a.day - b.day);

            const payload = {
                cropVarietyId: parseInt(formData.cropVarietyId),
                planName: formData.planName,
                totalDays: parseInt(formData.totalDays),
                costEstimate: parseFloat(formData.costEstimate),
                planDetails: JSON.stringify(sortedActivities)
            };

            if (editingPlan) {
                await api.put(`/admin/standard-plans/${editingPlan.id}`, payload);
            } else {
                await api.post('/admin/standard-plans', payload);
            }
            setShowDialog(false);
            fetchData();
        } catch (error) {
            console.error('Failed to save plan:', error);
            alert(error.response?.data?.error || 'Failed to save');
        }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`ต้องการลบ "${name}" ใช่หรือไม่?`)) return;

        try {
            await api.delete(`/admin/standard-plans/${id}`);
            fetchData();
        } catch (error) {
            console.error('Failed to delete plan:', error);
            alert(error.response?.data?.error || 'Failed to delete');
        }
    };

    const addActivity = () => {
        const maxDay = formData.activities.length > 0
            ? Math.max(...formData.activities.map(a => a.day))
            : 0;

        setFormData({
            ...formData,
            activities: [...formData.activities, {
                day: maxDay + 1,
                activityName: '',
                description: '',
                estimatedCost: 0
            }]
        });
    };

    const removeActivity = (index) => {
        const newActivities = formData.activities.filter((_, i) => i !== index);
        setFormData({ ...formData, activities: newActivities });
    };

    const updateActivity = (index, field, value) => {
        const newActivities = [...formData.activities];
        newActivities[index] = {
            ...newActivities[index],
            [field]: field === 'day' || field === 'estimatedCost' ? parseFloat(value) || 0 : value
        };
        setFormData({ ...formData, activities: newActivities });
    };

    if (loading) {
        return <div className="text-center py-12">กำลังโหลด...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">จัดการแผนการปลูกมาตรฐาน</h1>
                <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                    + เพิ่มแผนการปลูก
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ประเภทพืช</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">พันธุ์พืช</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อแผน</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ระยะเวลา</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ค่าใช้จ่ายโดยประมาณ</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {plans.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                    ยังไม่มีแผนการปลูกมาตรฐาน
                                </td>
                            </tr>
                        ) : (
                            plans.map((plan) => (
                                <tr key={plan.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-gray-600">{plan.cropTypeName}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                                            {plan.varietyName}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                                        {plan.planName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {plan.totalDays} วัน
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        ฿{plan.costEstimate?.toLocaleString() || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                        <button
                                            onClick={() => handleEdit(plan)}
                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            แก้ไข
                                        </button>
                                        <button
                                            onClick={() => handleDelete(plan.id, plan.planName)}
                                            className="text-red-600 hover:text-red-800 font-medium"
                                        >
                                            ลบ
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">
                                {editingPlan ? 'แก้ไขแผนการปลูก' : 'เพิ่มแผนการปลูก'}
                            </h2>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('edit')}
                                    className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === 'edit' ? 'bg-white shadow text-primary font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    แก้ไขข้อมูล
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('preview')}
                                    className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === 'preview' ? 'bg-white shadow text-primary font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    ดูตัวอย่างแผน
                                </button>
                            </div>
                        </div>

                        {viewMode === 'preview' ? (
                            <div className="space-y-4">
                                <PlanPreview
                                    activities={formData.activities}
                                    totalDays={formData.totalDays}
                                    planName={formData.planName || 'ตัวอย่างแผนการปลูก'}
                                />
                                <div className="flex gap-2 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setShowDialog(false)}
                                        className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                    >
                                        ปิด
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('edit')}
                                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                                    >
                                        กลับไปแก้ไข
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">พันธุ์พืช *</label>
                                        <select
                                            value={formData.cropVarietyId}
                                            onChange={(e) => setFormData({ ...formData, cropVarietyId: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        >
                                            <option value="">เลือกพันธุ์พืช</option>
                                            {varieties.map(variety => (
                                                <option key={variety.id} value={variety.id}>
                                                    {variety.cropType.name} - {variety.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">ชื่อแผน *</label>
                                        <input
                                            type="text"
                                            value={formData.planName}
                                            onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">ระยะเวลา (วัน) *</label>
                                        <input
                                            type="number"
                                            value={formData.totalDays}
                                            onChange={(e) => setFormData({ ...formData, totalDays: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">ค่าใช้จ่ายประมาณการ (฿) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.costEstimate}
                                            onChange={(e) => setFormData({ ...formData, costEstimate: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Activities Section */}
                                <div className="border-t pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-medium">ขั้นตอนการปลูก</h3>
                                        <button
                                            type="button"
                                            onClick={addActivity}
                                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                        >
                                            + เพิ่มขั้นตอน
                                        </button>
                                    </div>

                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {formData.activities.map((activity, index) => (
                                            <div key={index} className="p-4 border rounded-lg bg-gray-50">
                                                <div className="flex items-start justify-between mb-3">
                                                    <h4 className="font-medium text-sm">ขั้นตอนที่ {index + 1}</h4>
                                                    {formData.activities.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeActivity(index)}
                                                            className="text-red-600 hover:text-red-800 text-sm"
                                                        >
                                                            ✕ ลบ
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1">
                                                            วันที่ (นับจากวันปลูก) *
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={activity.day}
                                                            onChange={(e) => updateActivity(index, 'day', e.target.value)}
                                                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1">
                                                            ค่าใช้จ่าย (฿)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={activity.estimatedCost}
                                                            onChange={(e) => updateActivity(index, 'estimatedCost', e.target.value)}
                                                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mt-3">
                                                    <label className="block text-xs font-medium mb-1">
                                                        ชื่อขั้นตอน *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={activity.activityName}
                                                        onChange={(e) => updateActivity(index, 'activityName', e.target.value)}
                                                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                                        placeholder="เช่น เตรียมดิน, ปลูก, รดน้ำ"
                                                        required
                                                    />
                                                </div>

                                                <div className="mt-3">
                                                    <label className="block text-xs font-medium mb-1">
                                                        รายละเอียด
                                                    </label>
                                                    <textarea
                                                        value={activity.description}
                                                        onChange={(e) => updateActivity(index, 'description', e.target.value)}
                                                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                                        rows="2"
                                                        placeholder="อธิบายรายละเอียดของขั้นตอนนี้"
                                                    />
                                                </div>
                                            </div>
                                        ))}

                                        {formData.activities.length === 0 && (
                                            <div className="text-center py-8 text-gray-500">
                                                <p>ยังไม่มีขั้นตอน</p>
                                                <button
                                                    type="button"
                                                    onClick={addActivity}
                                                    className="mt-2 text-primary hover:underline"
                                                >
                                                    + เพิ่มขั้นตอนแรก
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setShowDialog(false)}
                                        className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                                    >
                                        {editingPlan ? 'อัปเดต' : 'สร้าง'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
