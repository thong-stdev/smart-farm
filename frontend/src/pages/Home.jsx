import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import StatCard from '../components/StatCard';
import CycleCard from '../components/CycleCard';
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const { user, logout } = useAuth();
    const { stats, activeCycles, isLoading, error, refresh } = useDashboard();
    const navigate = useNavigate();

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

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <div className="text-center">
                    <p className="text-destructive mb-4">เกิดข้อผิดพลาด: {error}</p>
                    <button
                        onClick={refresh}
                        className="px-4 py-2 bg-primary text-white rounded-lg"
                    >
                        ลองอีกครั้ง
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 pb-20">
            {/* Header */}
            <header className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-primary">สวัสดี,</h1>
                    <p className="text-lg font-medium">{user?.fullName || 'เกษตรกร'}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div
                        className="h-12 w-12 rounded-full bg-secondary overflow-hidden border-2 border-primary/10 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => navigate('/account')}
                    >
                        {user?.profileImage ? (
                            <img src={user.profileImage} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-primary font-bold text-xl">
                                {user?.fullName?.[0] || 'U'}
                            </div>
                        )}
                    </div>
                    {/* Admin Panel Button (only for admins) */}
                    {user?.role === 'admin' && (
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                        >
                            Admin Panel
                        </button>
                    )}
                    <button
                        onClick={logout}
                        className="p-2 text-red-500 bg-red-50 rounded-full hover:bg-red-100 transition-colors"
                        title="ออกจากระบบ"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Summary Cards */}
            <section className="mb-6">
                <h2 className="text-lg font-semibold mb-3">ภาพรวม</h2>
                <div className="grid grid-cols-2 gap-3">
                    <StatCard
                        icon="🏞️"
                        label="จำนวนแปลง"
                        value={stats.totalPlots}
                        color="bg-blue-100"
                    />
                    <StatCard
                        icon="🌱"
                        label="กำลังปลูก"
                        value={stats.activeCycles}
                        color="bg-green-100"
                    />
                    <StatCard
                        icon="📝"
                        label="กิจกรรมวันนี้"
                        value={stats.todayActivities}
                        color="bg-orange-100"
                    />
                    <StatCard
                        icon="🌾"
                        label="ใกล้เก็บเกี่ยว"
                        value={stats.upcomingHarvest}
                        color="bg-yellow-100"
                    />
                </div>
            </section>

            {/* Active Cycles */}
            <section className="mb-6">
                <h2 className="text-lg font-semibold mb-3">รอบปลูกที่กำลังทำ</h2>
                {activeCycles.length > 0 ? (
                    <div className="space-y-3">
                        {activeCycles.map(cycle => (
                            <div
                                key={cycle.id}
                                onClick={() => navigate(`/cycles/${cycle.id}`)}
                                className="cursor-pointer"
                            >
                                <CycleCard cycle={cycle} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-lg bg-card p-6 text-center border">
                        <p className="text-muted-foreground">ยังไม่มีรอบปลูกที่กำลังทำ</p>
                        <p className="text-sm text-muted-foreground mt-1">เริ่มสร้างแปลงและเริ่มปลูกพืชได้เลย!</p>
                    </div>
                )}
            </section>




        </div>
    );
}
