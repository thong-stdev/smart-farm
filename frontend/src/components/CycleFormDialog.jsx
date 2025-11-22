import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function CycleFormDialog({ isOpen, onClose, onSubmit, initialData = null, defaultPlotId = null, isLoading = false }) {
    const [formData, setFormData] = useState({
        plotId: '',
        cropTypeId: '',
        cropVarietyId: '',
        cycleName: '',
        startDate: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const [plots, setPlots] = useState([]);
    const [cropTypes, setCropTypes] = useState([]);
    const [cropVarieties, setCropVarieties] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Fetch plots and crop types on mount
    useEffect(() => {
        if (isOpen && !initialData) {
            fetchInitialData();
        }
    }, [isOpen]);

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (initialData) {
            setFormData({
                plotId: '',
                cropTypeId: '',
                cropVarietyId: '',
                cycleName: initialData.cycleName || '',
                startDate: new Date().toISOString().split('T')[0],
                notes: initialData.notes || ''
            });
        } else {
            setFormData({
                plotId: defaultPlotId || '',
                cropTypeId: '',
                cropVarietyId: '',
                cycleName: '',
                startDate: new Date().toISOString().split('T')[0],
                notes: ''
            });
            setCropVarieties([]);
        }
    }, [initialData, isOpen, defaultPlotId]);

    const fetchInitialData = async () => {
        try {
            setIsLoadingData(true);
            const [plotsRes, cropTypesRes] = await Promise.all([
                api.get('/plots'),
                api.get('/public/crop-types')
            ]);
            setPlots(plotsRes.data.plots || []);
            setCropTypes(cropTypesRes.data.cropTypes || []);
        } catch (err) {
            console.error('Failed to fetch initial data:', err);
            alert('ไม่สามารถโหลดข้อมูลได้');
        } finally {
            setIsLoadingData(false);
        }
    };

    const fetchCropVarieties = async (cropTypeId) => {
        try {
            const res = await api.get(`/public/crop-varieties?crop_type_id=${cropTypeId}`);
            setCropVarieties(res.data.varieties || []);
        } catch (err) {
            console.error('Failed to fetch crop varieties:', err);
            setCropVarieties([]);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // When crop type changes, fetch varieties
        if (name === 'cropTypeId') {
            setFormData(prev => ({ ...prev, cropVarietyId: '' }));
            if (value) {
                fetchCropVarieties(value);
            } else {
                setCropVarieties([]);
            }
        }

        // Auto-generate cycle name when plot or variety changes
        if (name === 'plotId' || name === 'cropVarietyId') {
            const plotName = name === 'plotId'
                ? plots.find(p => p.id === parseInt(value))?.plotName
                : plots.find(p => p.id === parseInt(formData.plotId))?.plotName;

            const varietyName = name === 'cropVarietyId'
                ? cropVarieties.find(v => v.id === parseInt(value))?.name
                : cropVarieties.find(v => v.id === parseInt(formData.cropVarietyId))?.name;

            if (plotName && varietyName) {
                setFormData(prev => ({
                    ...prev,
                    cycleName: `${varietyName} - ${plotName}`
                }));
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (initialData) {
            // Edit mode - only allow cycleName and notes
            onSubmit({
                cycleName: formData.cycleName.trim() || null,
                notes: formData.notes.trim() || null
            });
        } else {
            // Create mode
            onSubmit({
                plotId: parseInt(formData.plotId),
                cropVarietyId: parseInt(formData.cropVarietyId),
                cycleName: formData.cycleName.trim() || null,
                startDate: formData.startDate,
                notes: formData.notes.trim() || null
            });
        }
    };

    if (!isOpen) return null;

    const isEditMode = !!initialData;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-semibold">
                        {isEditMode ? 'แก้ไขรอบปลูก' : 'เริ่มรอบปลูกใหม่'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {isLoadingData ? (
                        <div className="text-center py-8">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                            <p className="text-sm text-gray-600 mt-2">กำลังโหลด...</p>
                        </div>
                    ) : (
                        <>
                            {!isEditMode && (
                                <>
                                    {/* Plot Selection */}
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            เลือกแปลง <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="plotId"
                                            value={formData.plotId}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        >
                                            <option value="">-- เลือกแปลง --</option>
                                            {plots.map(plot => (
                                                <option key={plot.id} value={plot.id}>
                                                    {plot.plotName} ({plot.areaRai} ไร่)
                                                </option>
                                            ))}
                                        </select>
                                        {plots.length === 0 && (
                                            <p className="text-xs text-red-600 mt-1">
                                                ⚠️ คุณยังไม่มีแปลง กรุณาสร้างแปลงก่อน
                                            </p>
                                        )}
                                    </div>

                                    {/* Crop Type Selection */}
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            ประเภทพืช <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="cropTypeId"
                                            value={formData.cropTypeId}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        >
                                            <option value="">-- เลือกประเภทพืช --</option>
                                            {cropTypes.map(type => (
                                                <option key={type.id} value={type.id}>
                                                    {type.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Crop Variety Selection */}
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            พันธุ์พืช <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="cropVarietyId"
                                            value={formData.cropVarietyId}
                                            onChange={handleChange}
                                            required
                                            disabled={!formData.cropTypeId}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        >
                                            <option value="">-- เลือกพันธุ์พืช --</option>
                                            {cropVarieties.map(variety => (
                                                <option key={variety.id} value={variety.id}>
                                                    {variety.name}
                                                </option>
                                            ))}
                                        </select>
                                        {!formData.cropTypeId && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                กรุณาเลือกประเภทพืชก่อน
                                            </p>
                                        )}
                                    </div>

                                    {/* Start Date */}
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            วันเริ่มปลูก <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={formData.startDate}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Cycle Name */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    ชื่อรอบปลูก
                                </label>
                                <input
                                    type="text"
                                    name="cycleName"
                                    value={formData.cycleName}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="เช่น ข้าวโพดหวาน - แปลงหน้าบ้าน"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {isEditMode ? 'แก้ไขชื่อรอบปลูก' : 'ถ้าไม่ระบุ จะสร้างอัตโนมัติ'}
                                </p>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    หมายเหตุ
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                    placeholder="บันทึกข้อมูลเพิ่มเติม..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2 sticky bottom-0 bg-white pb-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2 border rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading || isLoadingData || plots.length === 0}
                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
                                >
                                    {isLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}
