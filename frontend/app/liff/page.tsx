'use client';

import { useLiff } from '@/hooks/useLiff';

/**
 * LIFF Landing Page
 * หน้าเริ่มต้นสำหรับเปิดใน LINE App
 */
export default function LiffPage() {
    const { isReady, isLoggedIn, isInClient, profile, error, login, closeWindow } = useLiff();

    // Loading state
    if (!isReady) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-green-700">กำลังเชื่อมต่อ LINE...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-red-50 to-red-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">⚠️</span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">เกิดข้อผิดพลาด</h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <p className="text-sm text-gray-500">กรุณาเปิดผ่าน LINE App</p>
                </div>
            </div>
        );
    }

    // Not logged in
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">🌾</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Smart Farm</h1>
                    <p className="text-gray-600 mb-6">ระบบจัดการฟาร์มอัจฉริยะ</p>

                    <button
                        onClick={login}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                        </svg>
                        เข้าสู่ระบบด้วย LINE
                    </button>
                </div>
            </div>
        );
    }

    // Logged in - Main menu
    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
            {/* Header */}
            <div className="bg-green-600 text-white p-4 pb-12">
                <div className="flex items-center gap-3">
                    {profile?.pictureUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={profile.pictureUrl}
                            alt={profile.displayName}
                            className="w-12 h-12 rounded-full border-2 border-white"
                        />
                    )}
                    <div>
                        <p className="text-green-100 text-sm">สวัสดี 👋</p>
                        <h1 className="text-lg font-bold">{profile?.displayName || 'เกษตรกร'}</h1>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="px-4 -mt-8 space-y-4">
                <div className="bg-white rounded-xl shadow-lg p-4">
                    <h2 className="text-sm font-medium text-gray-500 mb-3">ทำอะไรดี?</h2>

                    <div className="grid grid-cols-2 gap-3">
                        <button className="bg-green-50 hover:bg-green-100 rounded-lg p-4 text-center transition-colors">
                            <span className="text-2xl mb-2 block">📝</span>
                            <span className="text-sm font-medium text-gray-700">บันทึกกิจกรรม</span>
                        </button>

                        <button className="bg-blue-50 hover:bg-blue-100 rounded-lg p-4 text-center transition-colors">
                            <span className="text-2xl mb-2 block">🌾</span>
                            <span className="text-sm font-medium text-gray-700">ดูแปลงเกษตร</span>
                        </button>

                        <button className="bg-yellow-50 hover:bg-yellow-100 rounded-lg p-4 text-center transition-colors">
                            <span className="text-2xl mb-2 block">🤖</span>
                            <span className="text-sm font-medium text-gray-700">ถาม AI</span>
                        </button>

                        <button className="bg-purple-50 hover:bg-purple-100 rounded-lg p-4 text-center transition-colors">
                            <span className="text-2xl mb-2 block">📊</span>
                            <span className="text-sm font-medium text-gray-700">รายงาน</span>
                        </button>
                    </div>
                </div>

                {/* Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-700">
                        💡 <strong>Tip:</strong> พิมพ์ข้อความในแชท เช่น &quot;ใส่ปุ๋ย 2 กก แปลง A&quot; แล้ว AI จะช่วยบันทึกให้อัตโนมัติ!
                    </p>
                </div>

                {/* Close button for LIFF in client */}
                {isInClient && (
                    <button
                        onClick={closeWindow}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                        ปิดหน้าต่าง
                    </button>
                )}
            </div>
        </div >
    );
}
