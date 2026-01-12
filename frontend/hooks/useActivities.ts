// useActivities hook

'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import { Activity, ActivitySummary, CreateActivityDto, ActivityType } from '@/types';

interface UseActivitiesOptions {
    type?: ActivityType;
    plotId?: string;
    limit?: number;
}

interface PaginatedActivities {
    data: Activity[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export function useActivities(options: UseActivitiesOptions = {}) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchActivities = useCallback(async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (options.type) params.append('type', options.type);
            if (options.plotId) params.append('plotId', options.plotId);
            if (options.limit) params.append('limit', options.limit.toString());

            const data = await api.get<PaginatedActivities>(`/activities?${params}`);
            setActivities(data.data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [options.type, options.plotId, options.limit]);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    const createActivity = async (data: CreateActivityDto): Promise<Activity> => {
        const activity = await api.post<Activity>('/activities', data);
        await fetchActivities();
        return activity;
    };

    const deleteActivity = async (id: string): Promise<void> => {
        await api.delete(`/activities/${id}`);
        await fetchActivities();
    };

    return {
        activities,
        isLoading,
        error,
        refetch: fetchActivities,
        createActivity,
        deleteActivity,
    };
}

export function useActivitySummary() {
    const [summary, setSummary] = useState<ActivitySummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSummary = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await api.get<ActivitySummary>('/activities/summary');
            setSummary(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    return {
        summary,
        isLoading,
        error,
        refetch: fetchSummary,
    };
}

export default useActivities;
