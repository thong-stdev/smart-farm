import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function CropTypes() {
    const [cropTypes, setCropTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', iconUrl: '' });

    useEffect(() => {
        fetchCropTypes();
    }, []);

    const fetchCropTypes = async () => {
        try {
            setLoading(true);
            const response = await api.get('/public/crop-types');
            if (response.data.success) {
                setCropTypes(response.data.cropTypes);
            }
        } catch (error) {
            console.error('Failed to fetch crop types:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingType(null);
        setFormData({ name: '', description: '', iconUrl: '' });
        setShowDialog(true);
    };

    const handleEdit = (type) => {
        setEditingType(type);
        setFormData({
            name: type.name,
            description: type.description || '',
            iconUrl: type.iconUrl || ''
        });
        setShowDialog(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingType) {
                // Update
                await api.put(`/admin/crop-types/${editingType.id}`, formData);
            } else {
                // Create
                await api.post('/admin/crop-types', formData);
            }
            setShowDialog(false);
            fetchCropTypes();
        } catch (error) {
            console.error('Failed to save crop type:', error);
            alert(error.response?.data?.error || 'Failed to save');
        }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`ต้องการลบ "${name}" ใช่หรือไม่?`)) return;

        try {
            await api.delete(`/admin/crop-types/${id}`);
            fetchCropTypes();
        } catch (error) {
            console.error('Failed to delete crop type:', error);
            alert(error.response?.data?.error || 'Failed to delete');
        }
    };

    if (loading) {
        return <div className="text-center py-12">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Crop Types Management</h1>
                <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                    + Add Crop Type
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Icon</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Varieties</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {cropTypes.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                    No crop types yet
                                </td>
                            </tr>
                        ) : (
                            cropTypes.map((type) => (
                                <tr key={type.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-2xl">
                                        {type.iconUrl || '🌾'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                                        {type.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {type.description || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                            {type.varietyCount} varieties
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                        <button
                                            onClick={() => handleEdit(type)}
                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(type.id, type.name)}
                                            className="text-red-600 hover:text-red-800 font-medium"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Dialog */}
            {showDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">
                            {editingType ? 'Edit Crop Type' : 'Add Crop Type'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    rows="3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Icon (emoji)</label>
                                <input
                                    type="text"
                                    value={formData.iconUrl}
                                    onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="🌾"
                                />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowDialog(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                                >
                                    {editingType ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
