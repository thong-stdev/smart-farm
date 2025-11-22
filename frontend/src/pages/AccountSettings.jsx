import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLiff } from '../contexts/LiffContext';
import logger from '../utils/logger';
import { User, Smartphone, Mail, Shield, Key, CheckCircle } from 'lucide-react';

export default function AccountSettings() {
    const { user, linkSocialAccount, setPassword } = useAuth();
    const { liff, profile, login: liffLogin } = useLiff();
    const [linking, setLinking] = useState(false);
    const [settingPassword, setSettingPassword] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        username: user?.username || '',
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (user?.username) {
            setPasswordForm(prev => ({ ...prev, username: user.username }));
        }
    }, [user]);

    const isProviderLinked = (providerName) => {
        if (!user?.providers) return false;
        return user.providers.some(p => {
            if (typeof p === 'string') return p === providerName;
            return p.provider === providerName;
        });
    };

    const handleLinkLine = async () => {
        if (!liff) {
            setMessage({ type: 'error', text: 'LIFF SDK not initialized' });
            return;
        }

        if (!liff.isLoggedIn()) {
            liffLogin(); // This might redirect
            return;
        }

        // If already logged in to LIFF, try to link
        try {
            setLinking(true);
            setMessage({ type: '', text: '' });

            const accessToken = liff.getAccessToken();
            const idToken = liff.getDecodedIDToken();

            // We need to make sure we have the profile
            let currentProfile = profile;
            if (!currentProfile) {
                currentProfile = await liff.getProfile();
            }

            await linkSocialAccount('line', currentProfile.userId, {
                displayName: currentProfile.displayName,
                pictureUrl: currentProfile.pictureUrl,
                email: idToken?.email
            });

            setMessage({ type: 'success', text: 'Linked LINE account successfully' });
            // Refresh user data would be good here, but page reload works for now
            window.location.reload();
        } catch (error) {
            logger.error('Link LINE failed:', error);
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to link LINE account' });
        } finally {
            setLinking(false);
        }
    };

    const handleSetPassword = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (passwordForm.password !== passwordForm.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        if (passwordForm.password.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        try {
            setSettingPassword(true);
            await setPassword(passwordForm.username, passwordForm.password);
            setMessage({ type: 'success', text: 'Password set successfully' });
            setPasswordForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
        } catch (error) {
            logger.error('Set password failed:', error);
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to set password' });
        } finally {
            setSettingPassword(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl space-y-6 pb-24">
            <h1 className="text-2xl font-bold mb-6">การตั้งค่าบัญชี</h1>

            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <div className="flex items-center space-x-4">
                    {user?.profileImage ? (
                        <img src={user.profileImage} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-8 h-8 text-gray-500" />
                        </div>
                    )}
                    <div>
                        <h2 className="text-xl font-semibold">{user?.fullName || user?.username}</h2>
                        <p className="text-gray-500 text-sm">Role: {user?.role}</p>
                    </div>
                </div>

                <div className="grid gap-4 pt-4 border-t">
                    <div className="flex items-center text-gray-600">
                        <Mail className="w-5 h-5 mr-3" />
                        <span>{user?.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                        <Smartphone className="w-5 h-5 mr-3" />
                        <span>{user?.phone || 'No phone number'}</span>
                    </div>
                </div>
            </div>

            {message.text && (
                <div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {/* Set Password Section */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                    <Key className="w-5 h-5 mr-2" />
                    ตั้งรหัสผ่านเข้าสู่ระบบ
                </h3>
                <p className="text-sm text-gray-500">
                    กำหนด Username และ Password เพื่อใช้เข้าสู่ระบบผ่านหน้าเว็บโดยไม่ต้องใช้ LINE
                </p>

                <form onSubmit={handleSetPassword} className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input
                            type="text"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Username"
                            value={passwordForm.username}
                            onChange={(e) => setPasswordForm({ ...passwordForm, username: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input
                            type="password"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="New Password"
                            value={passwordForm.password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <input
                            type="password"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Confirm Password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={settingPassword}
                        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                    >
                        {settingPassword ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่าน'}
                    </button>
                </form>
            </div>

            {/* Linked Accounts */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    บัญชีที่เชื่อมต่อ
                </h3>

                <div className="space-y-3">
                    {/* LINE */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-[#06C755] rounded flex items-center justify-center text-white font-bold text-xs">
                                LINE
                            </div>
                            <span className="font-medium">LINE Account</span>
                        </div>
                        {isProviderLinked('line') ? (
                            <span className="flex items-center text-green-600 text-sm font-medium px-3 py-1 bg-green-50 rounded-full">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                เชื่อมต่อแล้ว
                            </span>
                        ) : (
                            <button
                                onClick={handleLinkLine}
                                disabled={linking}
                                className="text-sm bg-white border border-gray-300 hover:bg-gray-50 px-3 py-1 rounded-md transition-colors"
                            >
                                {linking ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อ'}
                            </button>
                        )}
                    </div>

                    {/* Google (Placeholder) */}
                    <div className="flex items-center justify-between p-3 border rounded-lg opacity-60">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center text-white font-bold text-xs">
                                G
                            </div>
                            <span className="font-medium">Google Account</span>
                        </div>
                        <span className="text-xs text-gray-400">เร็วๆ นี้</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
