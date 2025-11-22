import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function ActivityFormDialog({
    isOpen,
    onClose,
    onSubmit,
    onDeleteImage,
    cycleId,
    cycleStartDate,
    cycleEndDate,
    initialData = null,
    isLoading = false
}) {
    const [formData, setFormData] = useState({
        activityTypeId: '',
        activityDate: new Date().toISOString().split('T')[0],
        cost: '',
        revenue: '',
        notes: ''
    });

    const [activityTypes, setActivityTypes] = useState([]);
    const [isLoadingTypes, setIsLoadingTypes] = useState(false);
    const [errors, setErrors] = useState({});

    // Image handling
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [existingImages, setExistingImages] = useState([]);

    // Fetch activity types on mount
    useEffect(() => {
        if (isOpen && activityTypes.length === 0) {
            fetchActivityTypes();
        }
    }, [isOpen]);

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (initialData) {
            setFormData({
                activityTypeId: initialData.activityType.id,
                activityDate: new Date(initialData.activityDate).toISOString().split('T')[0],
                cost: initialData.cost > 0 ? initialData.cost : '',
                revenue: initialData.revenue > 0 ? initialData.revenue : '',
                notes: initialData.notes || ''
            });
            setExistingImages(initialData.images || []);
        } else {
            setFormData({
                activityTypeId: '',
                activityDate: new Date().toISOString().split('T')[0],
                cost: '',
                revenue: '',
                notes: ''
            });
            setExistingImages([]);
        }
        setSelectedFiles([]);
        setPreviewUrls([]);
        setErrors({});
    }, [initialData, isOpen]);

    // Cleanup preview URLs
    useEffect(() => {
        return () => {
            previewUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [previewUrls]);

    const fetchActivityTypes = async () => {
        try {
            setIsLoadingTypes(true);
            const res = await api.get('/public/activity-types');
            setActivityTypes(res.data.activityTypes || []);
        } catch (err) {
            console.error('Failed to fetch activity types:', err);
            alert('ไม่สามารถโหลดประเภทกิจกรรมได้');
        } finally {
            setIsLoadingTypes(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + selectedFiles.length + existingImages.length > 5) {
            alert('สามารถอัปโหลดรูปภาพได้สูงสุด 5 รูป');
            return;
        }

        const newFiles = [...selectedFiles, ...files];
        setSelectedFiles(newFiles);

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviewUrls(prev => [...prev, ...newPreviews]);
    };

    const removeSelectedFile = (index) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);

        URL.revokeObjectURL(previewUrls[index]);
        const newPreviews = previewUrls.filter((_, i) => i !== index);
        setPreviewUrls(newPreviews);
    };

    const handleDeleteExistingImage = async (imageId) => {
        if (window.confirm('ต้องการลบรูปภาพนี้ใช่หรือไม่?')) {
            try {
                await onDeleteImage(initialData.id, imageId);
                setExistingImages(prev => prev.filter(img => img.id !== imageId));
            } catch (err) {
                console.error('Failed to delete image:', err);
                alert('ไม่สามารถลบรูปภาพได้');
            }
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.activityTypeId) {
            newErrors.activityTypeId = 'กรุณาเลือกประเภทกิจกรรม';
        }

        if (!formData.activityDate) {
            newErrors.activityDate = 'กรุณาระบุวันที่';
        } else {
            const activityDate = new Date(formData.activityDate);
            const startDate = new Date(cycleStartDate);

            if (activityDate < startDate) {
                newErrors.activityDate = 'วันที่กิจกรรมต้องไม่น้อยกว่าวันเริ่มปลูก';
            }

            if (cycleEndDate) {
                const endDate = new Date(cycleEndDate);
                if (activityDate > endDate) {
                    newErrors.activityDate = 'วันที่กิจกรรมต้องไม่เกินวันเก็บเกี่ยว';
                }
            }
        }

        if (formData.cost && parseFloat(formData.cost) < 0) {
            newErrors.cost = 'ค่าใช้จ่ายต้องเป็นจำนวนบวก';
        }

        if (formData.revenue && parseFloat(formData.revenue) < 0) {
            newErrors.revenue = 'รายได้ต้องเป็นจำนวนบวก';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const submitData = {
            activityTypeId: parseInt(formData.activityTypeId),
            activityDate: formData.activityDate,
            cost: formData.cost ? parseFloat(formData.cost) : 0,
            revenue: formData.revenue ? parseFloat(formData.revenue) : 0,
            notes: formData.notes.trim() || null,
            files: selectedFiles // Pass files to parent
        };

        if (!initialData) {
            submitData.cycleId = cycleId;
        }

        onSubmit(submitData);
    };

    if (!isOpen) return null;

    const isEditMode = !!initialData;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-semibold">
                        {isEditMode ? 'แก้ไขกิจกรรม' : 'บันทึกกิจกรรม'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {isLoadingTypes ? (
                        <div className="text-center py-8">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                            <p className="text-sm text-gray-600 mt-2">กำลังโหลด...</p>
                        </div>
                    ) : (
                        <>
                            {/* Activity Type Selection */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    ประเภทกิจกรรม <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="activityTypeId"
                                    value={formData.activityTypeId}
                                    onChange={handleChange}
                                    required
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${errors.activityTypeId ? 'border-red-500' : ''
                                        }`}
                                >
                                    <option value="">-- เลือกประเภทกิจกรรม --</option>
                                    {activityTypes.map(type => (
                                        <option key={type.id} value={type.id}>
                                            {type.icon} {type.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.activityTypeId && (
                                    <p className="text-xs text-red-600 mt-1">{errors.activityTypeId}</p>
                                )}
                            </div>

                            {/* Activity Date */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    วันที่ทำกิจกรรม <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="activityDate"
                                    value={formData.activityDate}
                                    onChange={handleChange}
                                    min={cycleStartDate}
                                    max={cycleEndDate || undefined}
                                    required
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${errors.activityDate ? 'border-red-500' : ''
                                        }`}
                                />
                                {errors.activityDate && (
                                    <p className="text-xs text-red-600 mt-1">{errors.activityDate}</p>
                                )}
                            </div>

                            {/* Cost & Revenue */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        ค่าใช้จ่าย (บาท)
                                    </label>
                                    <input
                                        type="number"
                                        name="cost"
                                        value={formData.cost}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.01"
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        รายได้ (บาท)
                                    </label>
                                    <input
                                        type="number"
                                        name="revenue"
                                        value={formData.revenue}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.01"
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="0.00"
                                    />
                                </div>
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
                                    rows={2}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                    placeholder="บันทึกรายละเอียดเพิ่มเติม..."
                                />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    รูปภาพประกอบ ({existingImages.length + selectedFiles.length}/5)
                                </label>

                                {/* Existing Images */}
                                {existingImages.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2 mb-2">
                                        {existingImages.map(img => (
                                            <div key={img.id} className="relative aspect-square">
                                                <img
                                                    src={img.imageUrl}
                                                    alt="Activity"
                                                    className="w-full h-full object-cover rounded-lg border"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteExistingImage(img.id)}
                                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* New Selected Images */}
                                {previewUrls.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2 mb-2">
                                        {previewUrls.map((url, index) => (
                                            <div key={index} className="relative aspect-square">
                                                <img
                                                    src={url}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover rounded-lg border"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeSelectedFile(index)}
                                                    className="absolute -top-1 -right-1 bg-gray-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Upload Button */}
                                {(existingImages.length + selectedFiles.length < 5) && (
                                    <div className="flex items-center justify-center w-full">
                                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <span className="text-2xl text-gray-400">📷</span>
                                                <p className="text-xs text-gray-500 mt-1">คลิกเพื่อเพิ่มรูปภาพ</p>
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                multiple
                                                accept="image/*"
                                                onChange={handleFileSelect}
                                            />
                                        </label>
                                    </div>
                                )}
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
                                    disabled={isLoading || isLoadingTypes}
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
