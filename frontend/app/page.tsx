import Link from "next/link";
import {
    Sprout,
    LayoutDashboard,
    ClipboardList,
    BarChart3,
    ArrowRight
} from "lucide-react";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-farm-green-50 to-white">
            {/* Header */}
            <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl gradient-farm flex items-center justify-center">
                            <Sprout className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-farm-green-800">Smart Farm</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-6">
                        <Link href="/web/dashboard" className="text-gray-600 hover:text-farm-green-600 transition">
                            แดชบอร์ด
                        </Link>
                        <Link href="/web/plots" className="text-gray-600 hover:text-farm-green-600 transition">
                            แปลงเกษตร
                        </Link>
                        <Link href="/web/activities" className="text-gray-600 hover:text-farm-green-600 transition">
                            กิจกรรม
                        </Link>
                    </nav>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/auth/login"
                            className="px-4 py-2 text-farm-green-600 hover:text-farm-green-700 font-medium transition"
                        >
                            เข้าสู่ระบบ
                        </Link>
                        <Link
                            href="/auth/register"
                            className="px-4 py-2 bg-farm-green-600 text-white rounded-lg hover:bg-farm-green-700 transition font-medium"
                        >
                            สมัครสมาชิก
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="container mx-auto px-4 py-20 text-center">
                <div className="animate-slide-up">
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                        จัดการแปลงเกษตร<br />
                        <span className="text-farm-green-600">อย่างชาญฉลาด</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        บันทึกกิจกรรม ติดตามต้นทุน วิเคราะห์ผลผลิต และวางแผนการเพาะปลูก
                        ด้วยระบบจัดการแปลงเกษตรอัจฉริยะ
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <Link
                            href="/auth/register"
                            className="px-8 py-4 bg-farm-green-600 text-white rounded-xl hover:bg-farm-green-700 transition font-medium text-lg flex items-center gap-2 shadow-lg shadow-farm-green-600/30"
                        >
                            เริ่มต้นใช้งานฟรี
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/liff/dashboard"
                            className="px-8 py-4 bg-white text-farm-green-600 rounded-xl hover:bg-gray-50 transition font-medium text-lg border border-farm-green-200"
                        >
                            ใช้งานผ่าน LINE
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="container mx-auto px-4 py-20">
                <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                    ฟีเจอร์หลัก
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Feature 1 */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover">
                        <div className="w-12 h-12 rounded-xl bg-farm-green-100 flex items-center justify-center mb-4">
                            <Sprout className="w-6 h-6 text-farm-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            จัดการแปลง
                        </h3>
                        <p className="text-gray-600">
                            สร้างและจัดการแปลงเกษตร พร้อมพิกัดแผนที่และรูปภาพ
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                            <ClipboardList className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            บันทึกกิจกรรม
                        </h3>
                        <p className="text-gray-600">
                            บันทึกรายรับ รายจ่าย และงานเกษตรทุกรูปแบบ
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                            <BarChart3 className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            รายงานและวิเคราะห์
                        </h3>
                        <p className="text-gray-600">
                            ดูสรุปต้นทุน กำไร และผลผลิตแต่ละแปลง
                        </p>
                    </div>

                    {/* Feature 4 */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                            <LayoutDashboard className="w-6 h-6 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            AI ผู้ช่วย
                        </h3>
                        <p className="text-gray-600">
                            บันทึกข้อมูลด้วยเสียงหรือข้อความ AI แปลงให้อัตโนมัติ
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="container mx-auto px-4 py-20">
                <div className="bg-gradient-to-r from-farm-green-600 to-farm-green-700 rounded-3xl p-12 text-center text-white">
                    <h2 className="text-3xl font-bold mb-4">
                        พร้อมเริ่มต้นจัดการแปลงเกษตรแล้วหรือยัง?
                    </h2>
                    <p className="text-farm-green-100 mb-8 text-lg">
                        สมัครใช้งานฟรี ไม่มีค่าใช้จ่าย
                    </p>
                    <Link
                        href="/auth/register"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-farm-green-600 rounded-xl hover:bg-gray-50 transition font-medium text-lg"
                    >
                        สมัครสมาชิกเลย
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg gradient-farm flex items-center justify-center">
                                <Sprout className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-semibold text-gray-700">Smart Farm</span>
                        </div>
                        <p className="text-gray-500 text-sm">
                            © 2026 Smart Farm. สงวนลิขสิทธิ์
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
