// usePlots hook

'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import { Plot, CreatePlotDto, UpdatePlotDto } from '@/types';

export function usePlots() {
    const [plots, setPlots] = useState<Plot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPlots = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await api.get<Plot[]>('/plots');
            setPlots(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPlots();
    }, [fetchPlots]);

    const createPlot = async (data: CreatePlotDto): Promise<Plot> => {
        const plot = await api.post<Plot>('/plots', data);
        await fetchPlots();
        return plot;
    };

    const updatePlot = async (id: string, data: UpdatePlotDto): Promise<Plot> => {
        const plot = await api.patch<Plot>(`/plots/${id}`, data);
        await fetchPlots();
        return plot;
    };

    const deletePlot = async (id: string): Promise<void> => {
        await api.delete(`/plots/${id}`);
        await fetchPlots();
    };

    return {
        plots,
        isLoading,
        error,
        refetch: fetchPlots,
        createPlot,
        updatePlot,
        deletePlot,
    };
}

export default usePlots;
