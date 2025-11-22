import { useState, useEffect } from 'react';

export default function PlotFormDialog({ isOpen, onClose, onSubmit, initialData = null, isLoading = false }) {
    const [formData, setFormData] = useState({
        plotName: '',
        areaRai: '',
        latitude: '',
        longitude: '',
        notes: ''
    });
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                plotName: initialData.plotName || '',
                areaRai: initialData.areaRai ? initialData.areaRai.toString() : '',
                latitude: initialData.latitude ? initialData.latitude.toString() : '',
                longitude: initialData.longitude ? initialData.longitude.toString() : '',
                notes: initialData.notes || ''
            });
        } else {
            setFormData({
                plotName: '',
                areaRai: '',
                latitude: '',
                longitude: '',
                notes: ''
            });
        }
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง');
            return;
        }

        setIsGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: position.coords.latitude.toFixed(6),
                    longitude: position.coords.longitude.toFixed(6)
                }));
                setIsGettingLocation(false);
            },
            (error) => {
                console.error('Error getting location:', error);
                let errorMsg = 'ไม่สามารถรับตำแหน่งได้';

                if (error.code === 1) {
                    errorMsg = 'กรุณาอนุญาตการเข้าถึงตำแหน่ง';
                } else if (error.code === 2) {
                    errorMsg = 'ไม่พบตำแหน่ง (ลองใส่พิกัดด้วยตนเอง)';
                } else if (error.code === 3) {
                    errorMsg = 'หมดเวลาในการรับตำแหน่ง';
                }

                alert(errorMsg);
                setIsGettingLocation(false);
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Convert rai to sqm (1 rai = 1600 sqm)
        const areaRai = parseFloat(formData.areaRai);
        const areaSqm = areaRai * 1600;

        onSubmit({
            plotName: formData.plotName.trim(),
            areaSqm: areaSqm,
            latitude: formData.latitude ? parseFloat(formData.latitude) : null,
            longitude: formData.longitude ? parseFloat(formData.longitude) : null,
            notes: formData.notes.trim() || null
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-semibold">
                        {initialData ? 'แก้ไขแปลง' : 'เพิ่มแปลงใหม่'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Plot Name */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            ชื่อแปลง <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="plotName"
                            value={formData.plotName}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="เช่น แปลงหน้าบ้าน"
                        />
                    </div>

                    {/* Area in Rai */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            ขนาดพื้นที่ (ไร่) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                name="areaRai"
                                step="0.001"
                                value={formData.areaRai}
                                onChange={handleChange}
                                required
                                min="0.001"
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-12"
                                placeholder="0.5"
                            />
                            <span className="absolute right-3 top-2.5 text-gray-500 text-sm">
                                ไร่
                            </span>
                        </div>
                        {formData.areaRai && (
                            <p className="text-sm text-gray-600 mt-1">
                                ≈ {(parseFloat(formData.areaRai) * 1600).toFixed(2)} ตร.ม.
                            </p>
                        )}
                    </div>

                    {/* GPS Coordinates */}
                    <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium">
                                📍 ตำแหน่งแปลง (ไม่บังคับ)
                            </label>
                            <button
                                type="button"
                                onClick={handleGetCurrentLocation}
                                disabled={isGettingLocation}
                                className="text-sm text-primary hover:underline disabled:opacity-50"
                            >
                                {isGettingLocation ? 'กำลังดึงตำแหน่ง...' : '📍 ใช้ตำแหน่งปัจจุบัน'}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">ละติจูด</label>
                                <input
                                    type="number"
                                    name="latitude"
                                    step="0.000001"
                                    value={formData.latitude}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                    placeholder="13.736717"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">ลองจิจูด</label>
                                <input
                                    type="number"
                                    name="longitude"
                                    step="0.000001"
                                    value={formData.longitude}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                    placeholder="100.523186"
                                />
                            </div>
                        </div>

                        {formData.latitude && formData.longitude && (
                            <a
                                href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                            >
                                🗺️ ดูใน Google Maps
                            </a>
                        )}
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
                            placeholder="ข้อมูลเพิ่มเติมเกี่ยวกับแปลง..."
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
                            disabled={isLoading || !formData.plotName || !formData.areaRai}
                            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
                        >
                            {isLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
