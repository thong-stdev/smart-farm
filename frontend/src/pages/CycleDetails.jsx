import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import CompleteCycleDialog from '../components/CompleteCycleDialog';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import ActivityFormDialog from '../components/ActivityFormDialog';

export default function CycleDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [cycle, setCycle] = useState(null);
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showCompleteDialog, setShowCompleteDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showActivityDialog, setShowActivityDialog] = useState(false);
    const [editingActivity, setEditingActivity] = useState(null);
    const [deletingActivity, setDeletingActivity] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Plan viewing
    const [showPlanDialog, setShowPlanDialog] = useState(false);
    const [standardPlans, setStandardPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [loadingPlans, setLoadingPlans] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        fetchCycleDetails();
    }, [id]);

    const fetchCycleDetails = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const res = await api.get(`/cycles/${id}`);
            setCycle(res.data.cycle);
            setActivities(res.data.activities || []);
        } catch (err) {
            console.error('Failed to fetch cycle details:', err);
            setError(err.response?.data?.error || 'ไม่สามารถโหลดข้อมูลได้');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStandardPlans = async () => {
        if (!cycle?.cropVariety?.id) return;

        try {
            setLoadingPlans(true);
            const res = await api.get(`/public/standard-plans/${cycle.cropVariety.id}`);
            if (res.data.success) {
                setStandardPlans(res.data.plans);
                if (res.data.plans.length > 0) {
                    setSelectedPlan(res.data.plans[0]);
                }
            }
        } catch (err) {
            console.error('Failed to fetch plans:', err);
            setStandardPlans([]);
        } finally {
            setLoadingPlans(false);
        }
    };

    const handleViewPlan = () => {
        setShowPlanDialog(true);
        fetchStandardPlans();
    };

    const handleComplete = async (data) => {
        try {
            setIsSubmitting(true);
            await api.post(`/cycles/${id}/complete`, data);
            setShowCompleteDialog(false);
            navigate('/cycles');
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
            await api.delete(`/cycles/${id}`);
            navigate('/cycles');
        } catch (err) {
            console.error('Failed to delete cycle:', err);
            alert(err.response?.data?.error || 'ไม่สามารถลบรอบปลูกได้');
            setIsSubmitting(false);
        }
    };

    const handleCreateActivity = async (data) => {
        try {
            setIsSubmitting(true);
            const res = await api.post('/activities', {
                cycleId: data.cycleId,
                activityTypeId: data.activityTypeId,
                activityDate: data.activityDate,
                cost: data.cost,
                revenue: data.revenue,
                notes: data.notes
            });

            if (data.files && data.files.length > 0) {
                const formData = new FormData();
                data.files.forEach(file => {
                    formData.append('files', file);
                });
                await api.post(`/activities/${res.data.activity.id}/images`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            setShowActivityDialog(false);
            fetchCycleDetails();
        } catch (err) {
            console.error('Failed to create activity:', err);
            alert(err.response?.data?.error || 'ไม่สามารถบันทึกกิจกรรมได้');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditActivity = async (data) => {
        try {
            setIsSubmitting(true);
            await api.patch(`/activities/${editingActivity.id}`, {
                cost: data.cost,
                revenue: data.revenue,
                notes: data.notes
            });

            if (data.files && data.files.length > 0) {
                const formData = new FormData();
                data.files.forEach(file => {
                    formData.append('files', file);
                });
                await api.post(`/activities/${editingActivity.id}/images`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            setEditingActivity(null);
            fetchCycleDetails();
        } catch (err) {
            console.error('Failed to update activity:', err);
            alert(err.response?.data?.error || 'ไม่สามารถแก้ไขกิจกรรมได้');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteImage = async (activityId, imageId) => {
        try {
            await api.delete(`/activities/${activityId}/images/${imageId}`);
            if (editingActivity && editingActivity.id === activityId) {
                setEditingActivity(prev => ({
                    ...prev,
                    images: prev.images.filter(img => img.id !== imageId)
                }));
            }
            fetchCycleDetails();
        } catch (err) {
            console.error('Failed to delete image:', err);
            throw err;
        }
    };

    const handleDeleteActivity = async () => {
        try {
            setIsSubmitting(true);
            await api.delete(`/activities/${deletingActivity.id}`);
            setDeletingActivity(null);
            fetchCycleDetails();
        } catch (err) {
            console.error('Failed to delete activity:', err);
            alert(err.response?.data?.error || 'ไม่สามารถลบกิจกรรมได้');
            setIsSubmitting(false);
        }
    };

    // Calculate actual date from cycle start date
    const calculateActivityDate = (dayNumber) => {
        if (!cycle?.startDate) return null;
        const startDate = new Date(cycle.startDate);
        const activityDate = new Date(startDate);
        activityDate.setDate(startDate.getDate() + (dayNumber - 1));
        return activityDate;
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

    if (error || !cycle) {
        return (
            <div className="min-h-screen bg-background p-4">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error || 'ไม่พบข้อมูลรอบปลูก'}
                </div>
                <button
                    onClick={() => navigate('/cycles')}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
                >
                    ← กลับ
                </button>
            </div>
        );
    }

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
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${badges[status] || badges.active}`}>
                {labels[status] || status}
            </span>
        );
    };

    const progressPercentage = cycle.expectedHarvestDate
        ? Math.min(
            100,
            (cycle.daysElapsed / Math.floor(
                (new Date(cycle.expectedHarvestDate) - new Date(cycle.startDate)) / (1000 * 60 * 60 * 24)
            )) * 100
        )
        : 0;

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentActivities = activities.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(activities.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="min-h-screen bg-background p-4 pb-20">
            <header className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/cycles')} className="text-2xl">←</button>
                    <div>
                        <h1 className="text-xl font-bold">
                            {cycle.cycleName || `${cycle.cropVariety.name} - ${cycle.plot.plotName}`}
                        </h1>
                        <p className="text-sm text-gray-600">{cycle.cropVariety.cropType}</p>
                    </div>
                </div>
                {getStatusBadge(cycle.status)}
            </header>

            {/* Summary Section */}
            <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold">ข้อมูลรอบปลูก</h2>
                    <button
                        onClick={handleViewPlan}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                    >
                        📋 ดูแผน
                    </button>
                </div>

                {/* Plot Info */}
                <div className="mb-4 pb-4 border-b">
                    <p className="text-sm text-gray-600 mb-2">แปลง</p>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">ชื่อแปลง:</span>
                            <span className="font-medium">{cycle.plot.plotName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">พันธุ์พืช:</span>
                            <span className="font-medium">{cycle.cropVariety.name}</span>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="mb-4 pb-4 border-b">
                    <p className="text-sm text-gray-600 mb-2">ไทม์ไลน์</p>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">วันเริ่มปลูก:</span>
                            <span className="font-medium">{new Date(cycle.startDate).toLocaleDateString('th-TH')}</span>
                        </div>
                        {cycle.expectedHarvestDate && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">คาดว่าเก็บเกี่ยว:</span>
                                <span className="font-medium">{new Date(cycle.expectedHarvestDate).toLocaleDateString('th-TH')}</span>
                            </div>
                        )}
                        {cycle.endDate && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">วันเก็บเกี่ยวจริง:</span>
                                <span className="font-medium text-green-600">{new Date(cycle.endDate).toLocaleDateString('th-TH')}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-gray-600">
                                {cycle.status === 'completed' ? 'ระยะเวลารวม:' : 'ผ่านมาแล้ว:'}
                            </span>
                            <span className="font-medium text-primary">{cycle.daysElapsed} วัน</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                {cycle.status === 'active' && cycle.expectedHarvestDate && (
                    <div className="mb-4 pb-4 border-b">
                        <p className="text-sm text-gray-600 mb-2">ความคืบหน้า</p>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-green-500 h-3 rounded-full transition-all"
                                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 text-right">
                            {progressPercentage.toFixed(0)}%
                        </p>
                    </div>
                )}

                {/* Financial Summary */}
                {cycle.status === 'completed' && (
                    <div>
                        <p className="text-sm text-gray-600 mb-2">สรุปการเงิน</p>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">ต้นทุนรวม:</span>
                                <span className="font-medium text-red-600">
                                    ฿{cycle.totalCost?.toLocaleString() || 0}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">รายได้รวม:</span>
                                <span className="font-medium text-green-600">
                                    ฿{cycle.totalRevenue?.toLocaleString() || 0}
                                </span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                                <span className="text-gray-600 font-semibold">กำไร/ขาดทุน:</span>
                                <span className={`font-bold ${(cycle.totalRevenue - cycle.totalCost) >= 0
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                    }`}>
                                    ฿{((cycle.totalRevenue || 0) - (cycle.totalCost || 0)).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Activities Section */}
            <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold">กิจกรรม ({activities.length})</h2>
                    {cycle.status === 'active' && (
                        <button
                            onClick={() => setShowActivityDialog(true)}
                            className="px-3 py-1 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark"
                        >
                            + เพิ่มกิจกรรม
                        </button>
                    )}
                </div>

                {currentActivities.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">ยังไม่มีกิจกรรม</p>
                ) : (
                    <>
                        <div className="space-y-3">
                            {currentActivities.map((activity) => (
                                <div key={activity.id} className="border rounded-lg p-3">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h3 className="font-medium">{activity.activityType.name}</h3>
                                            <p className="text-sm text-gray-600">
                                                {new Date(activity.activityDate).toLocaleDateString('th-TH')}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingActivity(activity)}
                                                className="text-blue-600 text-sm hover:underline"
                                            >
                                                แก้ไข
                                            </button>
                                            <button
                                                onClick={() => setDeletingActivity(activity)}
                                                className="text-red-600 text-sm hover:underline"
                                            >
                                                ลบ
                                            </button>
                                        </div>
                                    </div>

                                    {activity.notes && (
                                        <p className="text-sm text-gray-700 mb-2">{activity.notes}</p>
                                    )}

                                    <div className="flex gap-4 text-sm">
                                        {activity.cost > 0 && (
                                            <span className="text-red-600">
                                                ค่าใช้จ่าย: ฿{activity.cost.toLocaleString()}
                                            </span>
                                        )}
                                        {activity.revenue > 0 && (
                                            <span className="text-green-600">
                                                รายได้: ฿{activity.revenue.toLocaleString()}
                                            </span>
                                        )}
                                    </div>

                                    {activity.images && activity.images.length > 0 && (
                                        <div className="mt-2 flex gap-2 overflow-x-auto">
                                            {activity.images.map((image) => (
                                                <img
                                                    key={image.id}
                                                    src={image.imageUrl}
                                                    alt="Activity"
                                                    className="h-20 w-20 object-cover rounded"
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-4">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => paginate(page)}
                                        className={`px-3 py-1 rounded ${currentPage === page
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Action Buttons */}
            {cycle.status === 'active' && (
                <div className="flex gap-3 mb-20">
                    <button
                        onClick={() => setShowCompleteDialog(true)}
                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        จบรอบปลูก
                    </button>
                    <button
                        onClick={() => setShowDeleteDialog(true)}
                        className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        ลบ
                    </button>
                </div>
            )}

            {/* Plan Dialog */}
            {showPlanDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold">แผนการปลูก</h2>
                                <button
                                    onClick={() => setShowPlanDialog(false)}
                                    className="text-2xl text-gray-500 hover:text-gray-700"
                                >
                                    ×
                                </button>
                            </div>
                            {standardPlans.length > 1 && (
                                <select
                                    value={selectedPlan?.id || ''}
                                    onChange={(e) => {
                                        const plan = standardPlans.find(p => p.id === parseInt(e.target.value));
                                        setSelectedPlan(plan);
                                    }}
                                    className="mt-2 w-full px-3 py-2 border rounded-lg"
                                >
                                    {standardPlans.map(plan => (
                                        <option key={plan.id} value={plan.id}>{plan.planName}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {loadingPlans ? (
                                <div className="text-center py-8">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-2"></div>
                                    <p className="text-gray-600">กำลังโหลด...</p>
                                </div>
                            ) : standardPlans.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    ไม่มีแผนการปลูกสำหรับพันธุ์พืชนี้
                                </div>
                            ) : selectedPlan ? (
                                <div className="space-y-3">
                                    <div className="bg-blue-50 p-3 rounded-lg mb-4">
                                        <p className="text-sm text-gray-600">ระยะเวลา: {selectedPlan.totalDays} วัน</p>
                                        <p className="text-sm text-gray-600">
                                            ค่าใช้จ่ายประมาณการ: ฿{selectedPlan.costEstimate?.toLocaleString() || 0}
                                        </p>
                                    </div>

                                    <h3 className="font-semibold mb-2">ขั้นตอนการปลูก:</h3>
                                    {(() => {
                                        try {
                                            const activities = typeof selectedPlan.planDetails === 'string'
                                                ? JSON.parse(selectedPlan.planDetails)
                                                : selectedPlan.planDetails;

                                            return activities.map((activity, index) => {
                                                const activityDate = calculateActivityDate(activity.day);
                                                return (
                                                    <div key={index} className="border rounded-lg p-3 bg-gray-50">
                                                        <div className="flex items-start justify-between mb-1">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-semibold">
                                                                        วันที่ {activity.day}
                                                                    </span>
                                                                    {activityDate && (
                                                                        <span className="text-sm text-gray-600">
                                                                            ({activityDate.toLocaleDateString('th-TH')})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <h4 className="font-medium text-primary">
                                                                    {activity.activityName}
                                                                </h4>
                                                            </div>
                                                            {activity.estimatedCost > 0 && (
                                                                <span className="text-sm text-orange-600">
                                                                    ฿{activity.estimatedCost.toLocaleString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {activity.description && (
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                {activity.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            });
                                        } catch (err) {
                                            return <div className="text-red-500 text-sm">ไม่สามารถแสดงข้อมูลแผนได้</div>;
                                        }
                                    })()}
                                </div>
                            ) : null}
                        </div>

                        <div className="p-4 border-t">
                            <button
                                onClick={() => setShowPlanDialog(false)}
                                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                ปิด
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Dialogs */}
            {showCompleteDialog && (
                <CompleteCycleDialog
                    onClose={() => setShowCompleteDialog(false)}
                    onConfirm={handleComplete}
                    isSubmitting={isSubmitting}
                />
            )}

            {showDeleteDialog && (
                <DeleteConfirmDialog
                    title="ลบรอบปลูก"
                    message="คุณแน่ใจหรือไม่ที่จะลบรอบปลูกนี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
                    onClose={() => setShowDeleteDialog(false)}
                    onConfirm={handleDelete}
                    isSubmitting={isSubmitting}
                />
            )}

            {showActivityDialog && (
                <ActivityFormDialog
                    isOpen={showActivityDialog}
                    cycleId={parseInt(id)}
                    cycleStartDate={cycle?.startDate}
                    cycleEndDate={cycle?.endDate}
                    onClose={() => setShowActivityDialog(false)}
                    onSubmit={handleCreateActivity}
                    isSubmitting={isSubmitting}
                />
            )}

            {editingActivity && (
                <ActivityFormDialog
                    isOpen={!!editingActivity}
                    cycleId={parseInt(id)}
                    cycleStartDate={cycle?.startDate}
                    cycleEndDate={cycle?.endDate}
                    initialData={editingActivity}
                    onClose={() => setEditingActivity(null)}
                    onSubmit={handleEditActivity}
                    onDeleteImage={handleDeleteImage}
                    isSubmitting={isSubmitting}
                />
            )}

            {deletingActivity && (
                <DeleteConfirmDialog
                    title="ลบกิจกรรม"
                    message="คุณแน่ใจหรือไม่ที่จะลบกิจกรรมนี้?"
                    onClose={() => setDeletingActivity(null)}
                    onConfirm={handleDeleteActivity}
                    isSubmitting={isSubmitting}
                />
            )}
        </div>
    );
}
