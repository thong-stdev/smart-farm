import { useEffect, useState } from 'react';
import api from '../../api/axios';
import ImageUpload from '../../components/ImageUpload';

export default function CropVarieties() {
    const [varieties, setVarieties] = useState([]);
    const [cropTypes, setCropTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingVariety, setEditingVariety] = useState(null);
    const [filterCropType, setFilterCropType] = useState('');
    const [formData, setFormData] = useState({
        cropTypeId: '',
        name: '',
        description: '',
        imageUrl: '',
        // Additional info fields
        growthPeriodDays: '',
        idealTemperature: '',
        waterRequirement: '',
        sunlightRequirement: '',
        soilType: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [varietiesRes, typesRes] = await Promise.all([
                api.get('/public/crop-varieties'),
                api.get('/public/crop-types')
            ]);

            if (varietiesRes.data.success) {
                setVarieties(varietiesRes.data.varieties);
            }
            if (typesRes.data.success) {
                setCropTypes(typesRes.data.cropTypes);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingVariety(null);
        setFormData({
            cropTypeId: '',
            name: '',
            description: '',
            imageUrl: '',
            growthPeriodDays: '',
            idealTemperature: '',
            waterRequirement: '',
            sunlightRequirement: '',
            soilType: ''
        });
        setShowDialog(true);
    };

    const handleEdit = (variety) => {
        setEditingVariety(variety);

        // Parse additional info from JSON
        const additionalInfo = variety.additionalInfo || {};

        setFormData({
            cropTypeId: variety.cropTypeId,
            name: variety.name,
            description: variety.description || '',
            imageUrl: variety.imageUrl || '',
            growthPeriodDays: additionalInfo.growthPeriodDays || '',
            idealTemperature: additionalInfo.idealTemperature || '',
            waterRequirement: additionalInfo.waterRequirement || '',
            sunlightRequirement: additionalInfo.sunlightRequirement || '',
            soilType: additionalInfo.soilType || ''
        });
        setShowDialog(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Build additional info JSON from form fields
            const additionalInfo = {};
            if (formData.growthPeriodDays) additionalInfo.growthPeriodDays = parseInt(formData.growthPeriodDays);
            if (formData.idealTemperature) additionalInfo.idealTemperature = formData.idealTemperature;
            if (formData.waterRequirement) additionalInfo.waterRequirement = formData.waterRequirement;
            if (formData.sunlightRequirement) additionalInfo.sunlightRequirement = formData.sunlightRequirement;
            if (formData.soilType) additionalInfo.soilType = formData.soilType;

            const payload = {
                cropTypeId: parseInt(formData.cropTypeId),
                name: formData.name,
                description: formData.description,
                imageUrl: formData.imageUrl,
                additionalInfo: Object.keys(additionalInfo).length > 0 ? JSON.stringify(additionalInfo) : null
            };

            if (editingVariety) {
                await api.put(`/admin/crop-varieties/${editingVariety.id}`, payload);
            } else {
                await api.post('/admin/crop-varieties', payload);
            }
            setShowDialog(false);
            fetchData();
        } catch (error) {
            console.error('Failed to save variety:', error);
            alert(error.response?.data?.error || 'Failed to save');
        }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`ต้องการลบ "${name}" ใช่หรือไม่?`)) return;

        try {
            await api.delete(`/admin/crop-varieties/${id}`);
            fetchData();
        } catch (error) {
            console.error('Failed to delete variety:', error);
            alert(error.response?.data?.error || 'Failed to delete');
        }
    };

    const filteredVarieties = filterCropType
        ? varieties.filter(v => v.cropTypeId === parseInt(filterCropType))
        : varieties;

    if (loading) {
        return <div className="text-center py-12">กำลังโหลด...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">จัดการสายพันธุ์พืช</h1>
                <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                    + เพิ่มสายพันธุ์
                </button>
            </div>

            {/* Filter */}
            <div className="bg-white rounded-lg shadow p-4">
                <label className="block text-sm font-medium mb-2">กรองตามประเภทพืช</label>
                <select
                    value={filterCropType}
                    onChange={(e) => setFilterCropType(e.target.value)}
                    className="w-full md:w-64 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="">ทุกประเภท</option>
                    {cropTypes.map(type => (
                        <option key={type.id} value={type.id}>
                            {type.iconUrl} {type.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ประเภทพืช</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อสายพันธุ์</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">คำอธิบาย</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">รูปภาพ</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredVarieties.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                    ไม่พบสายพันธุ์พืช
                                </td>
                            </tr>
                        ) : (
                            filteredVarieties.map((variety) => (
                                <tr key={variety.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                                            {variety.cropType.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                                        {variety.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                        {variety.description || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {variety.imageUrl ? (
                                            <img
                                                src={variety.imageUrl}
                                                alt={variety.name}
                                                className="h-10 w-10 object-cover rounded"
                                            />
                                        ) : (
                                            <span className="text-gray-400">ไม่มีรูปภาพ</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                        <button
                                            onClick={() => handleEdit(variety)}
                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            แก้ไข
                                        </button>
                                        <button
                                            onClick={() => handleDelete(variety.id, variety.name)}
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

            {/* Dialog */}
            {showDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">
                            {editingVariety ? 'แก้ไขสายพันธุ์พืช' : 'เพิ่มสายพันธุ์พืช'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">ประเภทพืช *</label>
                                <select
                                    value={formData.cropTypeId}
                                    onChange={(e) => setFormData({ ...formData, cropTypeId: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    required
                                >
                                    <option value="">เลือกประเภทพืช</option>
                                    {cropTypes.map(type => (
                                        <option key={type.id} value={type.id}>
                                            {type.iconUrl} {type.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">ชื่อสายพันธุ์ *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">คำอธิบาย</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    rows="3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">รูปภาพ</label>
                                <ImageUpload
                                    value={formData.imageUrl}
                                    onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                                />
                            </div>

                            {/* Additional Information Section */}
                            <div className="pt-4 border-t">
                                <h3 className="font-medium mb-3">ข้อมูลเพิ่มเติม</h3>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">ระยะเวลาเติบโต (วัน)</label>
                                        <input
                                            type="number"
                                            value={formData.growthPeriodDays}
                                            onChange={(e) => setFormData({ ...formData, growthPeriodDays: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            placeholder="90"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">อุณหภูมิที่เหมาะสม</label>
                                        <input
                                            type="text"
                                            value={formData.idealTemperature}
                                            onChange={(e) => setFormData({ ...formData, idealTemperature: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            placeholder="25-35°C"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">ความต้องการน้ำ</label>
                                        <select
                                            value={formData.waterRequirement}
                                            onChange={(e) => setFormData({ ...formData, waterRequirement: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        >
                                            <option value="">เลือก...</option>
                                            <option value="low">น้อย</option>
                                            <option value="medium">ปานกลาง</option>
                                            <option value="high">มาก</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">ความต้องการแสงแดด</label>
                                        <select
                                            value={formData.sunlightRequirement}
                                            onChange={(e) => setFormData({ ...formData, sunlightRequirement: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        >
                                            <option value="">เลือก...</option>
                                            <option value="full-sun">แดดจัด</option>
                                            <option value="partial-shade">แดดรำไร</option>
                                            <option value="full-shade">ร่มเงา</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">สภาพดินที่เหมาะสม</label>
                                        <input
                                            type="text"
                                            value={formData.soilType}
                                            onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            placeholder="ดินร่วนระบายน้ำดี"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
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
                                    {editingVariety ? 'อัปเดต' : 'สร้าง'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
