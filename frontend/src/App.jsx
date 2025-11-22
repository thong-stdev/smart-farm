import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LiffProvider } from './contexts/LiffContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Plots from './pages/Plots';
import Cycles from './pages/Cycles';
import CycleDetails from './pages/CycleDetails';
import Reports from './pages/Reports';
import AccountSettings from './pages/AccountSettings';

import BottomNavigation from './components/BottomNavigation';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminUserDetail from './pages/admin/UserDetail';
import AdminCropTypes from './pages/admin/CropTypes';
import AdminCropVarieties from './pages/admin/CropVarieties';
import AdminStandardPlans from './pages/admin/StandardPlans';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return (
        <>
            <div className="pb-16">{children}</div>
            <BottomNavigation />
        </>
    );
};

function App() {
    return (
        <LiffProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route
                            path="/"
                            element={
                                <ProtectedRoute>
                                    <Home />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/plots"
                            element={
                                <ProtectedRoute>
                                    <Plots />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/cycles"
                            element={
                                <ProtectedRoute>
                                    <Cycles />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/cycles/:id"
                            element={
                                <ProtectedRoute>
                                    <CycleDetails />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/reports"
                            element={
                                <ProtectedRoute>
                                    <Reports />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/account"
                            element={
                                <ProtectedRoute>
                                    <AccountSettings />
                                </ProtectedRoute>
                            }
                        />
                        {/* Admin Routes */}
                        <Route
                            path="/admin/*"
                            element={
                                <AdminRoute>
                                    <AdminLayout />
                                </AdminRoute>
                            }
                        >
                            <Route index element={<Navigate to="/admin/dashboard" replace />} />
                            <Route path="dashboard" element={<AdminDashboard />} />
                            <Route path="users" element={<AdminUsers />} />
                            <Route path="users/:id" element={<AdminUserDetail />} />
                            <Route path="crop-types" element={<AdminCropTypes />} />
                            <Route path="crop-varieties" element={<AdminCropVarieties />} />
                            <Route path="standard-plans" element={<AdminStandardPlans />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </LiffProvider>
    );
}

export default App;
