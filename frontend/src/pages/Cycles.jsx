import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import CycleFormDialog from '../components/CycleFormDialog';
import CompleteCycleDialog from '../components/CompleteCycleDialog';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

export default function Cycles() {
    const navigate = useNavigate();
    const [cycles, setCycles] = useState([]);
    const [plots, setPlots] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPlot, setSelectedPlot] = useState('');

    const [showAddDialog, setShowAddDialog] = useState(false);
    const [completingCycle, setCompletingCycle] = useState(null);
    const [deletingCycle, setDeletingCycle] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (plots.length > 0) {
            fetchCycles();
        }
    }, [selectedPlot]);

    const fetchInitialData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const plotsRes = await api.get('/plots');
            setPlots(plotsRes.data.plots || []);

            // Fetch all cycles initially
            if (plotsRes.data.plots.length > 0) {
                await fetchCycles();
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError(err.response?.data?.error || 'ไม่สามารถโหลดข้อมูลได้');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCycles = async () => {
        try {
            // If no plots, don't fetch cycles
            if (plots.length === 0) {
                setCycles([]);
                return;
            }

            // Fetch cycles for specific plot or first plot
            const plotId = selectedPlot || (plots.length > 0 ? plots[0].id : null);
            if (!plotId) {
                setCycles([]);
                return;
            }

            const res = await api.get(`/cycles?plot_id=${plotId}`);
            setCycles(res.data.cycles || []);
        } catch (err) {
            console.error('Failed to fetch cycles:', err);
            setCycles([]);
        }
    };

    const handleCreate = async (data) => {
        try {
            setIsSubmitting(true);
            await api.post('/cycles', data);
            setShowAddDialog(false);
            fetchCycles();
        } catch (err) {
            console.error('Failed to create cycle:', err);
            const errorMsg = err.response?.data?.error || 'ไม่สามารถสร้างรอบปลูกได้';
            alert(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleComplete = async (data) => {
        try {
            setIsSubmitting(true);
            await api.post(`/cycles/${completingCycle.id}/complete`, data);
            setCompletingCycle(null);
            fetchCycles();
        } catch (err) {
            console.error('Failed to complete cycle:', err);
            alert(err.response?.data?.error || 'ไม่สามารถจบรอบปลูกได้');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        try {
            setIsSubmitting(true);
            await api.delete(`/cycles/${deletingCycle.id}`);
            setDeletingCycle(null);
            fetchCycles();
        } catch (err) {
            console.error('Failed to delete cycle:', err);
            alert(err.response?.data?.error || 'ไม่สามารถลบรอบปลูกได้');
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            active: 'bg-green-100 text-green-700',
            completed: 'bg-gray-100 text-gray-700',
            cancelled: 'bg-red-100 text-red-700'
        };
        const labels = {
            active: 'กำลังปลูก',
            completed: 'เสร็จสิ้น',
            cancelled: 'ยกเลิก'
        };
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${badges[status] || badges.active}`}>
                {labels[status] || status}
            </span>
        );
    };

    const groupedCycles = {
        active: cycles.filter(c => c.status === 'active'),
        completed: cycles.filter(c => c.status === 'completed')
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                    <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
                </div>
            </div>
        );
    }

    // No plots case
    if (plots.length === 0) {
        return (
            <div className="min-h-screen bg-background p-4">
                <header className="flex items-center gap-3 mb-6">
                    <button onClick={() => navigate('/')} className="text-2xl">←</button>
                    <h1 className="text-2xl font-bold">รอบการปลูก</h1>
                </header>

                <div className="flex flex-col items-center justify-center py-16">
                    <div className="text-6xl mb-4">🌱</div>
                    <h3 className="text-xl font-semibold mb-2">ยังไม่มีแปลง</h3>
                    <p className="text-muted-foreground mb-4">กรุณาสร้างแปลงก่อนเริ่มรอบปลูก</p>
                    <button
                        onClick={() => navigate('/plots')}
                        className="px-6 py-2 bg-primary text-white rounded-lg font-medium"
                    >
                        ➕ สร้างแปลง
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 pb-20">
            {/* Header */}
            <header className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/')} className="text-2xl">←</button>
                    <h1 className="text-2xl font-bold">รอบการปลูก</h1>
                </div>
            </header>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Plot Filter */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">กรองตามแปลง:</label>
                <select
                    value={selectedPlot}
                    onChange={(e) => setSelectedPlot(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    {plots.map(plot => (
                        <option key={plot.id} value={plot.id}>
                            {plot.plotName} ({plot.areaRai} ไร่)
                        </option>
                    ))}
                </select>
            </div>

            {/* Active Cycles */}
            {groupedCycles.active.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3 text-green-700">
                        🌱 กำลังปลูก ({groupedCycles.active.length})
                    </h2>
                    <div className="space-y-3">
                        {groupedCycles.active.map(cycle => (
                            <div
                                key={cycle.id}
                                className="bg-white rounded-lg p-4 shadow-sm border border-green-200 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigate(`/cycles/${cycle.id}`)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <h3 className="font-semibold">
                                            {cycle.cycleName || `${cycle.cropVariety.name} - ${cycle.plotName}`}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {cycle.cropVariety.cropType.name} • {cycle.plotName}
                                        </p>
                                    </div>
                                    {getStatusBadge(cycle.status)}
                                </div>

                                <div className="text-sm text-gray-600 mb-2">
                                    <p>เริ่ม: {new Date(cycle.startDate).toLocaleDateString('th-TH')}</p>
                                    <p>ผ่านมา: <span className="font-medium text-green-600">{cycle.daysElapsed} วัน</span></p>
                                    {cycle.expectedHarvestDate && (
                                        <p className="text-xs text-gray-500">
                                            คาดว่าเก็บเกี่ยว: {new Date(cycle.expectedHarvestDate).toLocaleDateString('th-TH')}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCompletingCycle(cycle);
                                        }}
                                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                                    >
                                        ✓ จบรอบ
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeletingCycle(cycle);
                                        }}
                                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                                    >
                                        🗑️ ลบ
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Completed Cycles */}
            {groupedCycles.completed.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3 text-gray-700">
                        ✅ เสร็จสิ้นแล้ว ({groupedCycles.completed.length})
                    </h2>
                    <div className="space-y-3">
                        {groupedCycles.completed.map(cycle => (
                            <div
                                key={cycle.id}
                                className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigate(`/cycles/${cycle.id}`)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <h3 className="font-semibold">
                                            {cycle.cycleName || `${cycle.cropVariety.name} - ${cycle.plotName}`}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {cycle.cropVariety.cropType.name} • {cycle.plotName}
                                        </p>
                                    </div>
                                    {getStatusBadge(cycle.status)}
                                </div>

                                <div className="text-sm text-gray-600">
                                    <p>ระยะเวลา: {cycle.daysElapsed} วัน</p>
                                    {cycle.profit !== undefined && (
                                        <p className={`font-medium ${cycle.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            กำไร: {cycle.profit >= 0 ? '+' : ''}{cycle.profit.toLocaleString()} บาท
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {cycles.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="text-6xl mb-4">🌱</div>
                    <h3 className="text-xl font-semibold mb-2">ยังไม่มีรอบปลูก</h3>
                    <p className="text-muted-foreground mb-4">เริ่มต้นรอบการปลูกแรกของคุณ</p>
                    <button
                        onClick={() => setShowAddDialog(true)}
                        className="px-6 py-2 bg-primary text-white rounded-lg font-medium"
                    >
                        🌱 เริ่มรอบปลูกใหม่
                    </button>
                </div>
            )}

            {/* Floating Action Button */}
            {cycles.length > 0 && (
                <button
                    onClick={() => setShowAddDialog(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center text-2xl active:scale-95 transition-transform"
                >
                    ➕
                </button>
            )}

            {/* Dialogs */}
            <CycleFormDialog
                isOpen={showAddDialog}
                onClose={() => setShowAddDialog(false)}
                onSubmit={handleCreate}
                isLoading={isSubmitting}
            />

            <CompleteCycleDialog
                isOpen={!!completingCycle}
                onClose={() => setCompletingCycle(null)}
                onSubmit={handleComplete}
                cycle={completingCycle}
                isLoading={isSubmitting}
            />

            <DeleteConfirmDialog
                isOpen={!!deletingCycle}
                onClose={() => setDeletingCycle(null)}
                onConfirm={handleDelete}
                itemName={deletingCycle?.cycleName || `รอบปลูก ${deletingCycle?.cropVariety?.name}`}
                isLoading={isSubmitting}
            />
        </div>
    );
}
