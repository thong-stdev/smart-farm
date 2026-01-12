"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Check, X, Clock, Loader2, ChevronRight, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface JobStats {
    pending: number;
    running: number;
    completed: number;
    failed: number;
}

interface Job {
    id: string;
    type: string;
    status: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any;
    createdAt: string;
    startedAt?: string;
    finishedAt?: string;
    lastError?: string;
    retryCount: number;
    maxRetry: number;
    progress?: Array<{
        entity: string;
        processed: number;
        total?: number;
    }>;
}

export default function AdminJobsPage() {
    const [stats, setStats] = useState<JobStats>({ pending: 0, running: 0, completed: 0, failed: 0 });
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    const fetchStats = useCallback(async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/jobs/stats/summary`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    }, []);

    const fetchJobs = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('adminToken');
            const statusParam = selectedStatus !== 'all' ? `?status=${selectedStatus.toUpperCase()}` : '';
            const res = await fetch(`${API_URL}/admin/jobs${statusParam}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setJobs(data.jobs || []);
            }
        } catch (err) {
            console.error('Failed to fetch jobs:', err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedStatus]);

    useEffect(() => {
        fetchStats();
        fetchJobs();
        const interval = setInterval(() => {
            fetchStats();
            fetchJobs();
        }, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, [selectedStatus, fetchStats, fetchJobs]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'RUNNING': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
            case 'FAILED': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING': return <Clock className="w-4 h-4" />;
            case 'RUNNING': return <Loader2 className="w-4 h-4 animate-spin" />;
            case 'COMPLETED': return <Check className="w-4 h-4" />;
            case 'FAILED': return <X className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('th-TH');
    };

    const calculateProgress = (job: Job) => {
        if (!job.progress || job.progress.length === 0) return null;
        const totalProcessed = job.progress.reduce((sum, p) => sum + p.processed, 0);
        const totalAll = job.progress.reduce((sum, p) => sum + (p.total || p.processed), 0);
        return totalAll > 0 ? Math.round((totalProcessed / totalAll) * 100) : null;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Background Jobs</h1>
                    <p className="text-gray-500">จัดการและติดตาม background jobs</p>
                </div>
                <Button onClick={() => { fetchStats(); fetchJobs(); }} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    รีเฟรช
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedStatus('pending')}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Pending</p>
                                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedStatus('running')}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Running</p>
                                <p className="text-3xl font-bold text-blue-600">{stats.running}</p>
                            </div>
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedStatus('completed')}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Completed</p>
                                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                            </div>
                            <Check className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedStatus('failed')}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Failed</p>
                                <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
                            </div>
                            <X className="w-8 h-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b">
                {['all', 'pending', 'running', 'completed', 'failed'].map(status => (
                    <button
                        key={status}
                        onClick={() => setSelectedStatus(status)}
                        className={`px-4 py-2 border-b-2 transition-colors capitalize ${selectedStatus === status
                            ? 'border-yellow-500 text-yellow-600 font-medium'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Jobs List */}
            <Card>
                <CardHeader>
                    <CardTitle>Jobs {selectedStatus !== 'all' && `- ${selectedStatus.toUpperCase()}`}</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p>ไม่มี jobs</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {jobs.map(job => {
                                const progress = calculateProgress(job);
                                return (
                                    <div key={job.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(job.status)}`}>
                                                    {getStatusIcon(job.status)}
                                                    {job.status}
                                                </span>
                                                <div>
                                                    <p className="font-medium text-gray-900">{job.type}</p>
                                                    <p className="text-sm text-gray-500">ID: {job.id.slice(0, 8)}...</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        </div>

                                        {/* Payload */}
                                        <div className="mb-2 text-sm">
                                            <span className="text-gray-500">Payload: </span>
                                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                                {JSON.stringify(job.payload)}
                                            </code>
                                        </div>

                                        {/* Progress */}
                                        {progress !== null && (
                                            <div className="mb-2">
                                                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                                    <span>Progress</span>
                                                    <span>{progress}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div className="bg-yellow-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Timestamps */}
                                        <div className="grid grid-cols-3 gap-4 text-xs text-gray-500">
                                            <div>
                                                <span className="font-medium">สร้าง:</span> {formatDate(job.createdAt)}
                                            </div>
                                            {job.startedAt && (
                                                <div>
                                                    <span className="font-medium">เริ่ม:</span> {formatDate(job.startedAt)}
                                                </div>
                                            )}
                                            {job.finishedAt && (
                                                <div>
                                                    <span className="font-medium">เสร็จ:</span> {formatDate(job.finishedAt)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Error */}
                                        {job.lastError && (
                                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                                <strong>Error:</strong> {job.lastError}
                                            </div>
                                        )}

                                        {/* Retry Info */}
                                        {job.retryCount > 0 && (
                                            <div className="mt-2 text-xs text-gray-500">
                                                Retry: {job.retryCount}/{job.maxRetry}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
