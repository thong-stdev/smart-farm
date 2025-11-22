import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import PlotHistoryDialog from '../components/PlotHistoryDialog';

export default function Reports() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // History Dialog State
    const [historyDialog, setHistoryDialog] = useState({
        isOpen: false,
        plotId: null,
        plotName: ''
    });

    useEffect(() => {
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        try {
            setIsLoading(true);
            const res = await api.get('/reports/overview');
            setData(res.data);
        } catch (err) {
            console.error('Failed to fetch reports:', err);
            setError('ไม่สามารถโหลดข้อมูลรายงานได้');
        } finally {
            setIsLoading(false);
        }
    };

    const openHistory = (e, plot) => {
        e.stopPropagation(); // Prevent navigating to plot details
        setHistoryDialog({
            isOpen: true,
            plotId: plot.id,
            plotName: plot.name
        });
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                    <p className="text-muted-foreground">กำลังประมวลผลข้อมูล...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background p-4">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
                >
                    กลับหน้าหลัก
                </button>
            </div>
        );
    }

    const { overview, recentActivities, plotStatuses } = data;

    return (
        <div className="min-h-screen bg-background p-4 pb-20">
            <header className="mb-6">
                <h1 className="text-2xl font-bold">รายงานภาพรวม</h1>
                <p className="text-gray-600">สรุปสถานะและข้อมูลการเงินของฟาร์ม</p>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                    <p className="text-sm text-gray-600 mb-1">พื้นที่ทั้งหมด</p>
                    <p className="text-xl font-bold text-blue-600">{overview.plots.totalAreaRai} ไร่</p>
                    <p className="text-xs text-gray-500">{overview.plots.total} แปลง</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                    <p className="text-sm text-gray-600 mb-1">กำลังปลูก</p>
                    <p className="text-xl font-bold text-green-600">{overview.plots.active} แปลง</p>
                    <p className="text-xs text-gray-500">ว่าง {overview.plots.empty} แปลง</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-red-100">
                    <p className="text-sm text-gray-600 mb-1">ค่าใช้จ่ายรวม</p>
                    <p className="text-lg font-bold text-red-600">{overview.financials.totalCost.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">บาท</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-emerald-100">
                    <p className="text-sm text-gray-600 mb-1">รายได้รวม</p>
                    <p className="text-lg font-bold text-emerald-600">{overview.financials.totalRevenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">บาท</p>
                </div>
            </div>

            {/* Net Profit Highlight */}
            <div className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg p-4 shadow-md mb-6">
                <p className="text-sm opacity-90 mb-1">กำไรสุทธิ (ทั้งหมด)</p>
                <p className="text-3xl font-bold">
                    {overview.financials.netProfit >= 0 ? '+' : ''}
                    {overview.financials.netProfit.toLocaleString()} บาท
                </p>
            </div>

            {/* Plot Status Overview */}
            <div className="mb-6">
                <h2 className="font-semibold mb-3 flex items-center justify-between">
                    <span>สถานะแปลงเพาะปลูก</span>
                    <span className="text-xs font-normal text-gray-500">ทั้งหมด {plotStatuses.length} แปลง</span>
                </h2>
                <div className="space-y-3">
                    {plotStatuses.map(plot => (
                        <div
                            key={plot.id}
                            className="bg-white rounded-lg p-3 shadow-sm border"
                            onClick={() => navigate(plot.activeCycle ? `/cycles/${plot.activeCycle.id}` : '/plots')}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{plot.name}</span>
                                        <span className="text-xs text-gray-500">({plot.areaRai} ไร่)</span>
                                    </div>
                                    {plot.status === 'active' ? (
                                        <p className="text-sm text-green-600 mt-1">
                                            🌱 {plot.activeCycle.cropName} ({plot.activeCycle.daysElapsed} วัน)
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-400 mt-1">ว่าง</p>
                                    )}
                                </div>
                                <div className={`w-3 h-3 rounded-full ${plot.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            </div>

                            <div className="flex justify-end pt-2 border-t mt-2">
                                <button
                                    onClick={(e) => openHistory(e, plot)}
                                    className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full flex items-center gap-1 transition-colors"
                                >
                                    📜 ประวัติการปลูก
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Activities */}
            <div>
                <h2 className="font-semibold mb-3">กิจกรรมล่าสุด</h2>
                {recentActivities.length > 0 ? (
                    <div className="space-y-3">
                        {recentActivities.map(activity => (
                            <div key={activity.id} className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-blue-400">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{activity.icon || '📝'}</span>
                                        <span className="font-medium text-sm">{activity.type}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {new Date(activity.date).toLocaleDateString('th-TH')}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 ml-7 mb-1">
                                    {activity.plotName} - {activity.cropName}
                                </p>
                                {(activity.cost > 0 || activity.revenue > 0) && (
                                    <div className="text-xs ml-7">
                                        {activity.cost > 0 && <span className="text-red-600 mr-2">-{activity.cost.toLocaleString()}</span>}
                                        {activity.revenue > 0 && <span className="text-green-600">+{activity.revenue.toLocaleString()}</span>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 text-center py-4 bg-white rounded-lg border border-dashed">
                        ยังไม่มีกิจกรรมล่าสุด
                    </p>
                )}
            </div>

            <PlotHistoryDialog
                isOpen={historyDialog.isOpen}
                onClose={() => setHistoryDialog(prev => ({ ...prev, isOpen: false }))}
                plotId={historyDialog.plotId}
                plotName={historyDialog.plotName}
            />
        </div>
    );
}
