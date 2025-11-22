import { useState, useEffect } from 'react';
import logger from '../utils/logger';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import PlotFormDialog from '../components/PlotFormDialog';
import CycleFormDialog from '../components/CycleFormDialog';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

export default function Plots() {
    const navigate = useNavigate();
    const [plots, setPlots] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showAddDialog, setShowAddDialog] = useState(false);
    const [editingPlot, setEditingPlot] = useState(null);
    const [deletingPlot, setDeletingPlot] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cycle Dialog State
    const [showCycleDialog, setShowCycleDialog] = useState(false);
    const [selectedPlotForCycle, setSelectedPlotForCycle] = useState(null);

    useEffect(() => {
        fetchPlots();
    }, []);

    const fetchPlots = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await api.get('/plots');
            setPlots(response.data.plots || []);
        } catch (err) {
            logger.error('Failed to fetch plots:', err);
            setError(err.response?.data?.error || 'ไม่สามารถโหลดข้อมูลแปลงได้');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (data) => {
        try {
            setIsSubmitting(true);
            logger.info('Creating plot with data:', data);
            const response = await api.post('/plots', data);
            logger.info('Create response:', response.data);
            setShowAddDialog(false);
            fetchPlots(); // Refresh list
        } catch (err) {
            logger.error('Failed to create plot:', err);
            logger.error('Error response:', err.response?.data);
            logger.error('Error status:', err.response?.status);
            const errorMsg = err.response?.data?.error || err.response?.data?.message || 'ไม่สามารถสร้างแปลงได้';
            alert(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async (data) => {
        try {
            setIsSubmitting(true);
            await api.patch(`/plots/${editingPlot.id}`, data);
            setEditingPlot(null);
            fetchPlots(); // Refresh list
        } catch (err) {
            logger.error('Failed to update plot:', err);
            alert(err.response?.data?.error || 'ไม่สามารถแก้ไขแปลงได้');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        try {
            setIsSubmitting(true);
            await api.delete(`/plots/${deletingPlot.id}`);
            setDeletingPlot(null);
            fetchPlots(); // Refresh list
        } catch (err) {
            logger.error('Failed to delete plot:', err);
            const errorMsg = err.response?.data?.error || 'ไม่สามารถลบแปลงได้';
            alert(errorMsg);
            setIsSubmitting(false);
        }
    };

    const handleStartPlanting = (plot) => {
        setSelectedPlotForCycle(plot.id);
        setShowCycleDialog(true);
    };

    const handleCreateCycle = async (data) => {
        try {
            setIsSubmitting(true);
            await api.post('/cycles', data);
            setShowCycleDialog(false);
            setSelectedPlotForCycle(null);
            fetchPlots(); // Refresh to update active cycle count
            alert('เริ่มรอบปลูกเรียบร้อยแล้ว 🌱');
        } catch (err) {
            logger.error('Failed to create cycle:', err);
            alert(err.response?.data?.error || 'ไม่สามารถสร้างรอบปลูกได้');
        } finally {
            setIsSubmitting(false);
        }
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

    return (
        <div className="min-h-screen bg-background p-4 pb-20">
            {/* Header */}
            <header className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="text-2xl"
                    >
                        ←
                    </button>
                    <h1 className="text-2xl font-bold">แปลงของฉัน</h1>
                </div>
            </header>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Plots Grid */}
            {plots.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-20">
                    {plots.map(plot => (
                        <div key={plot.id} className="bg-card rounded-lg p-4 shadow-sm border">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{plot.plotName}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {plot.areaSqm} ตร.ม. ({plot.areaRai} ไร่)
                                    </p>
                                </div>
                                <span className="text-2xl">🏞️</span>
                            </div>

                            {plot.notes && (
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{plot.notes}</p>
                            )}

                            <div className="flex items-center justify-between text-sm mb-3">
                                <span className="text-muted-foreground">
                                    สถานะ: {plot.activeCycles > 0 ? (
                                        <span className="font-medium text-green-600">🌱 กำลังปลูก</span>
                                    ) : (
                                        <span className="font-medium text-gray-500">ว่าง</span>
                                    )}
                                </span>
                                {plot.latitude && plot.longitude && (
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${plot.latitude},${plot.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                    >
                                        📍 แผนที่
                                    </a>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {plot.activeCycles === 0 && (
                                    <button
                                        onClick={() => handleStartPlanting(plot)}
                                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                                    >
                                        🌱 เริ่มปลูก
                                    </button>
                                )}
                                <button
                                    onClick={() => setEditingPlot(plot)}
                                    className={`px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded text-sm ${plot.activeCycles > 0 ? 'flex-1' : ''}`}
                                >
                                    ✏️ {plot.activeCycles > 0 ? 'แก้ไข' : ''}
                                </button>
                                <button
                                    onClick={() => setDeletingPlot(plot)}
                                    className="px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded text-sm"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="text-6xl mb-4">🏞️</div>
                    <h3 className="text-xl font-semibold mb-2">ยังไม่มีแปลง</h3>
                    <p className="text-muted-foreground mb-4">เริ่มต้นสร้างแปลงแรกของคุณ</p>
                    <button
                        onClick={() => setShowAddDialog(true)}
                        className="px-6 py-2 bg-primary text-white rounded-lg font-medium"
                    >
                        ➕ เพิ่มแปลงใหม่
                    </button>
                </div>
            )}

            {/* Floating Action Button */}
            {plots.length > 0 && (
                <button
                    onClick={() => setShowAddDialog(true)}
                    className="fixed bottom-20 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center text-2xl active:scale-95 transition-transform z-10"
                >
                    ➕
                </button>
            )}

            {/* Dialogs */}
            <PlotFormDialog
                isOpen={showAddDialog}
                onClose={() => setShowAddDialog(false)}
                onSubmit={handleCreate}
                isLoading={isSubmitting}
            />

            <PlotFormDialog
                isOpen={!!editingPlot}
                onClose={() => setEditingPlot(null)}
                onSubmit={handleUpdate}
                initialData={editingPlot}
                isLoading={isSubmitting}
            />

            <DeleteConfirmDialog
                isOpen={!!deletingPlot}
                onClose={() => setDeletingPlot(null)}
                onConfirm={handleDelete}
                itemName={deletingPlot?.plotName}
                isLoading={isSubmitting}
            />

            <CycleFormDialog
                isOpen={showCycleDialog}
                onClose={() => {
                    setShowCycleDialog(false);
                    setSelectedPlotForCycle(null);
                }}
                onSubmit={handleCreateCycle}
                defaultPlotId={selectedPlotForCycle}
                isLoading={isSubmitting}
            />
        </div>
    );
}
