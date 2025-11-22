import { useState } from 'react';

export default function CompleteCycleDialog({ isOpen, onClose, onSubmit, cycle, isLoading = false }) {
    const [formData, setFormData] = useState({
        endDate: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate end date is not before start date
        if (cycle && new Date(formData.endDate) < new Date(cycle.startDate)) {
            alert('วันที่จบต้องไม่น้อยกว่าวันเริ่มปลูก');
            return;
        }

        onSubmit({
            endDate: formData.endDate,
            notes: formData.notes.trim() || null
        });
    };

    if (!isOpen || !cycle) return null;

    const calculateDuration = () => {
        if (!formData.endDate) return 0;
        const start = new Date(cycle.startDate);
        const end = new Date(formData.endDate);
        return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    };

    const duration = calculateDuration();

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-semibold">จบรอบปลูก</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        {cycle.cycleName || `${cycle.cropVariety?.name} - ${cycle.plot?.plotName}`}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* End Date */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            วันที่เก็บเกี่ยว <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            min={new Date(cycle.startDate).toISOString().split('T')[0]}
                            required
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            วันเริ่มปลูก: {new Date(cycle.startDate).toLocaleDateString('th-TH')}
                        </p>
                    </div>

                    {/* Duration Summary */}
                    {duration > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm">
                                <span className="font-medium">ระยะเวลารวม:</span>{' '}
                                <span className="text-blue-700 font-semibold">{duration} วัน</span>
                            </p>
                        </div>
                    )}

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
                            placeholder="บันทึกผลการเก็บเกี่ยว, ปริมาณผลผลิต..."
                        />
                    </div>

                    {/* Warning */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                            ⚠️ การจบรอบปลูกจะทำให้สถานะเปลี่ยนเป็น "เสร็จสิ้น" และคุณจะสามารถเริ่มรอบใหม่ในแปลงนี้ได้
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
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
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                        >
                            {isLoading ? 'กำลังบันทึก...' : '✓ จบรอบปลูก'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
