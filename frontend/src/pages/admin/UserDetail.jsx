import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function UserDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [plots, setPlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUserData();
    }, [id]);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            const [userRes, plotsRes] = await Promise.all([
                api.get(`/admin/users/${id}`),
                api.get(`/admin/users/${id}/plots`)
            ]);

            if (userRes.data.success) {
                setUser(userRes.data.user);
            }
            if (plotsRes.data.success) {
                setPlots(plotsRes.data.plots);
            }
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            setError(error.response?.data?.error || 'Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                    onClick={() => navigate('/admin/users')}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                >
                    Back to Users
                </button>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">User not found</p>
            </div>
        );
    }

    // Filter plots with location
    const plotsWithLocation = plots.filter(p => p.latitude && p.longitude);

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <button
                onClick={() => navigate('/admin/users')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
                <span>←</span> Back to Users
            </button>

            {/* User Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start gap-6">
                    <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center text-white text-4xl font-bold">
                        {user.fullName?.[0] || '?'}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold mb-2">{user.fullName || 'No name'}</h1>
                        <div className="space-y-1 text-sm text-gray-600">
                            <p><strong>Email:</strong> {user.email || '-'}</p>
                            <p><strong>Phone:</strong> {user.phone || '-'}</p>
                            <p><strong>Role:</strong> <span className={`px-2 py-1 rounded text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                                }`}>{user.role}</span></p>
                            <p><strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString('th-TH')}</p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{user.stats?.totalPlots || 0}</p>
                        <p className="text-sm text-gray-600">Total Plots</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{user.stats?.activePlots || 0}</p>
                        <p className="text-sm text-gray-600">Active Plots</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-600">{user.stats?.emptyPlots || 0}</p>
                        <p className="text-sm text-gray-600">Empty Plots</p>
                    </div>
                </div>
            </div>

            {/* OAuth Providers */}
            {user.providers && user.providers.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Linked Accounts</h3>
                    <div className="space-y-2">
                        {user.providers.map((provider, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <span className="text-2xl">
                                    {provider.provider === 'line' ? '💬' : '🔑'}
                                </span>
                                <div>
                                    <p className="font-medium capitalize">{provider.provider}</p>
                                    <p className="text-sm text-gray-500">
                                        Connected: {new Date(provider.createdAt).toLocaleDateString('th-TH')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Map - Simple version without react-leaflet for now */}
            {plotsWithLocation.length > 0 ? (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Plot Locations ({plotsWithLocation.length} plots with GPS)</h3>
                    <div className="space-y-2">
                        {plotsWithLocation.map((plot) => (
                            <div key={plot.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-semibold">{plot.plotName}</h4>
                                        <p className="text-sm text-gray-600">{plot.areaRai} Rai</p>
                                        {plot.activeCycle && (
                                            <p className="text-sm text-green-600 mt-1">
                                                🌱 {plot.activeCycle.cropName}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right text-sm">
                                        <p className="text-green-600 font-medium">📍 GPS</p>
                                        <p className="text-xs text-gray-500">
                                            {plot.latitude.toFixed(4)}, {plot.longitude.toFixed(4)}
                                        </p>
                                        <a
                                            href={`https://www.google.com/maps?q=${plot.latitude},${plot.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                        >
                                            View on Google Maps →
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Google Maps Link for all plots */}
                    {plotsWithLocation.length > 1 && (
                        <div className="mt-4 pt-4 border-t">
                            <a
                                href={`https://www.google.com/maps/dir/${plotsWithLocation.map(p => `${p.latitude},${p.longitude}`).join('/')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                🗺️ View All Plots Route on Google Maps
                            </a>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Plot Locations</h3>
                    <p className="text-gray-500 text-center py-8">No plots with location data</p>
                </div>
            )}

            {/* Plots List */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">All Plots ({plots.length})</h3>
                {plots.length > 0 ? (
                    <div className="space-y-3">
                        {plots.map((plot) => (
                            <div key={plot.id} className="p-4 border rounded-lg hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold">{plot.plotName}</h4>
                                        <p className="text-sm text-gray-600">{plot.areaRai} Rai</p>
                                        {plot.activeCycle && (
                                            <p className="text-sm text-green-600 mt-1">
                                                🌱 {plot.activeCycle.cropName}
                                                <span className="text-gray-500 ml-2">
                                                    (Started: {new Date(plot.activeCycle.startDate).toLocaleDateString('th-TH')})
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right text-sm text-gray-500">
                                        {plot.latitude && plot.longitude ? (
                                            <span className="text-green-600">📍 Has Location</span>
                                        ) : (
                                            <span className="text-gray-400">No Location</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-8">No plots yet</p>
                )}
            </div>
        </div>
    );
}
