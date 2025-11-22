import { useState, useEffect } from 'react';
import api from '../api/axios';

export function useDashboard() {
    const [data, setData] = useState({
        plots: [],
        cycles: [],
        activities: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch plots and cycles in parallel
            const [plotsRes, cyclesRes] = await Promise.all([
                api.get('/plots').catch(err => ({ data: { plots: [] } })),
                api.get('/cycles').catch(err => ({ data: { cycles: [] } }))
            ]);

            setData({
                plots: plotsRes.data.plots || [],
                cycles: cyclesRes.data.cycles || [],
                activities: [] // Will be implemented later
            });
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
            setError(err.response?.data?.error || 'Failed to load dashboard data');
            // Set empty data on error to prevent crashes
            setData({
                plots: [],
                cycles: [],
                activities: []
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Calculate statistics
    const stats = {
        totalPlots: data.plots.length,
        activeCycles: data.cycles.filter(c => c.status === 'active').length,
        todayActivities: 0, // Placeholder
        upcomingHarvest: data.cycles.filter(c => {
            if (!c.expectedHarvestDate) return false;
            const harvestDate = new Date(c.expectedHarvestDate);
            const today = new Date();
            const daysUntil = Math.ceil((harvestDate - today) / (1000 * 60 * 60 * 24));
            return daysUntil >= 0 && daysUntil <= 7;
        }).length
    };

    const activeCycles = data.cycles.filter(c => c.status === 'active');

    return {
        data,
        stats,
        activeCycles,
        isLoading,
        error,
        refresh: fetchDashboardData
    };
}
