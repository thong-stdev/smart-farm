import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function PlotHistoryDialog({ isOpen, onClose, plotId, plotName }) {
    const [cycles, setCycles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen && plotId) {
            fetchHistory();
        }
    }, [isOpen, plotId]);

    const fetchHistory = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await api.get(`/cycles?plot_id=${plotId}`);
            // Filter only completed cycles
            const completedCycles = (response.data.cycles || []).filter(c => c.status === 'completed');
            setCycles(completedCycles);
        } catch (err) {
            console.error('Failed to fetch cycle history:', err);
            setError('ไม่สามารถโหลดประวัติการปลูกได้');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-lg">
                    <div>
                        <h2 className="text-xl font-semibold">ประวัติการปลูก</h2>
                        <p className="text-sm text-gray-600">แปลง: {plotName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                    >
                        &times;
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto flex-1">
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                            <p className="text-sm text-gray-600 mt-2">กำลังโหลดข้อมูล...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-600">
                            <p>{error}</p>
                            <button
                                onClick={fetchHistory}
                                className="mt-2 text-sm text-primary underline"
                            >
                                ลองใหม่
                            </button>
                        </div>
                    ) : cycles.length > 0 ? (
                        <div className="space-y-3">
                            {cycles.map(cycle => (
                                <div
                                    key={cycle.id}
                                    onClick={() => {
                                        onClose();
                                        navigate(`/cycles/${cycle.id}`);
                                    }}
                                    className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-medium text-lg">{cycle.cycleName || cycle.cropVariety.name}</h3>
                                            <p className="text-sm text-gray-600">{cycle.cropVariety.name}</p>
                                        </div>
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                            เสร็จสิ้น
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                                        <div>
                                            <span className="block text-xs text-gray-400">เริ่มปลูก</span>
                                            {new Date(cycle.startDate).toLocaleDateString('th-TH')}
                                        </div>
                                        <div>
                                            <span className="block text-xs text-gray-400">เก็บเกี่ยว</span>
                                            {cycle.endDate ? new Date(cycle.endDate).toLocaleDateString('th-TH') : '-'}
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t flex justify-between items-center text-sm">
                                        <span className="text-gray-500">
                                            กำไร: <span className={cycle.profit >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                                {cycle.profit > 0 ? '+' : ''}{cycle.profit.toLocaleString()}
                                            </span>
                                        </span>
                                        <span className="text-blue-600 text-xs flex items-center gap-1">
                                            ดูรายละเอียด →
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <span className="text-4xl block mb-2">📜</span>
                            <p>ยังไม่มีประวัติการปลูกที่เสร็จสิ้น</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
