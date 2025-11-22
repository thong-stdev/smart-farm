import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get('/admin/stats');
            if (response.data.success) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-12">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats?.users?.total || 0}
                    icon="👥"
                    color="blue"
                />
                <StatCard
                    title="Total Plots"
                    value={stats?.plots?.total || 0}
                    icon="🗺️"
                    color="green"
                    subtitle={`${stats?.plots?.totalAreaRai || 0} Rai`}
                />
                <StatCard
                    title="Active Cycles"
                    value={stats?.cycles?.active || 0}
                    icon="🌱"
                    color="yellow"
                />
                <StatCard
                    title="Completed Cycles"
                    value={stats?.cycles?.completed || 0}
                    icon="✅"
                    color="purple"
                />
            </div>

            {/* Financial Summary */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-blue-600">
                            ฿{stats?.financials?.totalRevenue?.toLocaleString() || 0}
                        </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Total Cost</p>
                        <p className="text-2xl font-bold text-red-600">
                            ฿{stats?.financials?.totalCost?.toLocaleString() || 0}
                        </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Total Profit</p>
                        <p className="text-2xl font-bold text-green-600">
                            ฿{stats?.financials?.totalProfit?.toLocaleString() || 0}
                        </p>
                    </div>
                </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
                <div className="space-y-3">
                    {stats?.recentActivities?.slice(0, 10).map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div>
                                <p className="font-medium">{activity.type}</p>
                                <p className="text-sm text-gray-500">
                                    {activity.userName} - {activity.plotName}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium">
                                    {new Date(activity.date).toLocaleDateString('th-TH')}
                                </p>
                                {activity.revenue > 0 && (
                                    <p className="text-sm text-green-600">+฿{activity.revenue}</p>
                                )}
                                {activity.cost > 0 && (
                                    <p className="text-sm text-red-600">-฿{activity.cost}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color, subtitle }) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        purple: 'bg-purple-50 text-purple-600'
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600 mb-1">{title}</p>
                    <p className="text-3xl font-bold">{value}</p>
                    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                </div>
                <div className={`w-12 h-12 rounded-full ${colorClasses[color]} flex items-center justify-center text-2xl`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
