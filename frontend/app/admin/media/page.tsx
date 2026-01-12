"use client";

import { useState, useEffect, useCallback } from "react";
import { Image as ImageIcon, Loader2, Trash2, Upload, Search, Grid, List, Download, Eye, FileImage, File } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRelativeTime } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface MediaFile {
    id: string;
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
    uploadedBy: string | null;
    createdAt: string;
}

export default function AdminMediaPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);

    const fetchFiles = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/media`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                setFiles(await res.json());
            }
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (!fileList || fileList.length === 0) return;

        try {
            setIsUploading(true);
            const token = localStorage.getItem('adminToken');
            const formData = new FormData();

            for (let i = 0; i < fileList.length; i++) {
                formData.append('files', fileList[i]);
            }

            const res = await fetch(`${API_URL}/upload/multiple`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            if (res.ok) {
                fetchFiles();
            } else {
                alert('อัปโหลดไม่สำเร็จ');
            }
        } catch (err) {
            console.error('Failed to upload:', err);
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบไฟล์นี้?')) return;

        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${API_URL}/admin/media/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setFiles(files.filter(f => f.id !== id));
            if (selectedFile?.id === id) setSelectedFile(null);
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const isImage = (mimetype: string) => mimetype.startsWith('image/');

    const filteredFiles = files.filter(f =>
        f.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">จัดการไฟล์</h1>
                    <p className="text-gray-500">จัดการไฟล์ที่อัปโหลดในระบบ</p>
                </div>
                <label className="cursor-pointer">
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleUpload}
                        className="hidden"
                    />
                    <Button asChild disabled={isUploading}>
                        <span>
                            {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                            อัปโหลด
                        </span>
                    </Button>
                </label>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <FileImage className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{files.length}</p>
                                <p className="text-sm text-gray-500">ไฟล์ทั้งหมด</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{files.filter(f => isImage(f.mimetype)).length}</p>
                                <p className="text-sm text-gray-500">รูปภาพ</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                <File className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
                                <p className="text-sm text-gray-500">ขนาดรวม</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="ค้นหาไฟล์..."
                        className="pl-10"
                    />
                </div>
                <div className="flex border rounded-lg overflow-hidden">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 ${viewMode === 'grid' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-50 text-gray-500'}`}
                    >
                        <Grid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 ${viewMode === 'list' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-50 text-gray-500'}`}
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Files Grid/List */}
            {filteredFiles.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12 text-gray-500">
                        <FileImage className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>ไม่พบไฟล์</p>
                    </CardContent>
                </Card>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredFiles.map((file) => (
                        <div
                            key={file.id}
                            className="group relative bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => setSelectedFile(file)}
                        >
                            {isImage(file.mimetype) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={file.url} alt={file.originalName} className="w-full h-32 object-cover" />
                            ) : (
                                <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                                    <File className="w-8 h-8 text-gray-400" />
                                </div>
                            )}
                            <div className="p-2">
                                <p className="text-xs font-medium text-gray-700 truncate">{file.originalName}</p>
                                <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ไฟล์</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ประเภท</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">ขนาด</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">อัปโหลดเมื่อ</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredFiles.map((file) => (
                                    <tr key={file.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {isImage(file.mimetype) ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={file.url} alt="" className="w-10 h-10 rounded object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                                                        <File className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                )}
                                                <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{file.originalName}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{file.mimetype}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500 text-right">{formatFileSize(file.size)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{formatRelativeTime(file.createdAt)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => setSelectedFile(file)}>
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <a href={file.url} download>
                                                    <Button variant="ghost" size="sm">
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                </a>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(file.id)}>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            {/* Preview Modal */}
            {selectedFile && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedFile(null)}>
                    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-bold truncate">{selectedFile.originalName}</h3>
                            <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="p-4">
                            {isImage(selectedFile.mimetype) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={selectedFile.url} alt={selectedFile.originalName} className="max-w-full max-h-[60vh] mx-auto" />
                            ) : (
                                <div className="text-center py-12">
                                    <File className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500">ไม่สามารถแสดงตัวอย่างได้</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                <span>{selectedFile.mimetype}</span> • <span>{formatFileSize(selectedFile.size)}</span>
                            </div>
                            <div className="flex gap-2">
                                <a href={selectedFile.url} download>
                                    <Button variant="outline" size="sm">
                                        <Download className="w-4 h-4 mr-2" /> ดาวน์โหลด
                                    </Button>
                                </a>
                                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(selectedFile.url); alert('คัดลอก URL แล้ว!'); }}>
                                    คัดลอก URL
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
