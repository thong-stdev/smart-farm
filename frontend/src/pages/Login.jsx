import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiff } from '../contexts/LiffContext';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';

export default function Login() {
    const { isReady, profile, login: liffLogin, isInClient } = useLiff();
    const { loginWithLine, login, isAuthenticated, isLoading, user } = useAuth();
    const navigate = useNavigate();
    const loginAttempted = useRef(false);

    const [tab, setTab] = useState('line'); // 'line' or 'local'
    const [form, setForm] = useState({ username: '', password: '' });
    const [error, setError] = useState('');

    // Auto-redirect if already logged in
    useEffect(() => {
        if (isAuthenticated && user) {
            logger.info('Authenticated! User role:', user.role);
            if (user.role === 'admin') {
                navigate('/admin/dashboard', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        }
    }, [isAuthenticated, user, navigate]);

    // Reset loginAttempted when user logs out
    useEffect(() => {
        if (!isAuthenticated && !profile) {
            loginAttempted.current = false;
        }
    }, [isAuthenticated, profile]);

    // Auto-login with LINE when ready
    useEffect(() => {
        if (isReady && profile && !isAuthenticated && !loginAttempted.current) {
            logger.info('Auto-login triggered...');
            loginAttempted.current = true;
            loginWithLine();
        }
    }, [isReady, profile, isAuthenticated, loginWithLine]);

    const handleLocalLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const result = await login(form.username, form.password);
            if (!result.success) {
                setError(result.error || 'Login failed');
            }
        } catch (err) {
            logger.error('Local login error:', err);
            setError('Unexpected error');
        }
    };

    if (isLoading || !isReady) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
                    <p className="text-muted-foreground">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    // If in LIFF client, show simplified UI
    if (isInClient) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
                <div className="w-full max-w-sm text-center space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-primary">Smart Farm</h1>
                        <p className="mt-2 text-sm text-muted-foreground">กำลังเข้าสู่ระบบด้วย LINE...</p>
                    </div>
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                    <button
                        onClick={liffLogin}
                        className="w-full rounded-lg bg-[#06C755] px-4 py-3 font-bold text-white shadow-lg"
                    >
                        ลองใหม่อีกครั้ง
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm space-y-8 text-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Smart Farm</h1>
                    <p className="mt-2 text-sm text-muted-foreground">ระบบจัดการฟาร์มอัจฉริยะ</p>
                </div>
                <div className="flex space-x-2 justify-center">
                    <button
                        className={`px-4 py-2 rounded-t ${tab === 'line' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'}`}
                        onClick={() => setTab('line')}
                    >
                        LINE
                    </button>
                    <button
                        className={`px-4 py-2 rounded-t ${tab === 'local' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'}`}
                        onClick={() => setTab('local')}
                    >
                        Username/Password
                    </button>
                </div>
                {tab === 'line' && (
                    <div className="space-y-4">
                        <button
                            onClick={liffLogin}
                            className="w-full rounded-lg bg-[#06C755] px-4 py-3 font-bold text-white shadow-lg transition-transform active:scale-95 hover:bg-[#05b34c]"
                        >
                            เข้าสู่ระบบด้วย LINE
                        </button>
                        <p className="text-xs text-muted-foreground">
                            หากยังไม่มีบัญชี ระบบจะสร้างบัญชีให้โดยอัตโนมัติ
                        </p>
                    </div>
                )}
                {tab === 'local' && (
                    <form onSubmit={handleLocalLogin} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Username"
                            className="w-full rounded border px-3 py-2"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full rounded border px-3 py-2"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                        />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button
                            type="submit"
                            className="w-full rounded bg-primary px-4 py-2 font-bold text-white"
                            disabled={isLoading}
                        >
                            {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'Login'}
                        </button>
                        <p className="text-sm">
                            ยังไม่มีบัญชี? <a href="/register" className="text-primary underline">สมัครสมาชิก</a>
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
