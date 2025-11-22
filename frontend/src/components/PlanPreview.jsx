import { Calendar, Clock, DollarSign } from 'lucide-react';

export default function PlanPreview({ activities = [], totalDays = 0, planName = 'แผนการปลูก' }) {
    const sortedActivities = [...activities].sort((a, b) => a.day - b.day);
    const totalCost = activities.reduce((sum, act) => sum + (parseFloat(act.estimatedCost) || 0), 0);

    return (
        <div className="bg-white border rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
                <h3 className="font-bold text-lg text-gray-800">{planName}</h3>
                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                        <Clock size={16} />
                        <span>ระยะเวลา: {totalDays} วัน</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <DollarSign size={16} />
                        <span>ต้นทุนรวม: ฿{totalCost.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        <span>จำนวนขั้นตอน: {activities.length}</span>
                    </div>
                </div>
            </div>

            <div className="p-6 relative">
                {/* Vertical Line */}
                <div className="absolute left-8 top-6 bottom-6 w-0.5 bg-gray-200"></div>

                <div className="space-y-6 relative">
                    {/* Start Node */}
                    <div className="flex gap-4">
                        <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center text-xs font-bold text-green-700">
                            0
                        </div>
                        <div className="pt-1">
                            <h4 className="font-bold text-gray-900">เริ่มต้นการปลูก</h4>
                            <p className="text-sm text-gray-500">วันที่ 0</p>
                        </div>
                    </div>

                    {/* Activities */}
                    {sortedActivities.map((activity, index) => (
                        <div key={index} className="flex gap-4 group">
                            <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-primary group-hover:bg-primary group-hover:text-white transition-colors flex items-center justify-center text-xs font-bold text-primary">
                                {activity.day}
                            </div>
                            <div className="flex-1 pt-1 bg-white p-3 rounded-lg border shadow-sm group-hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-gray-900">{activity.activityName || 'ไม่มีชื่อกิจกรรม'}</h4>
                                    {activity.estimatedCost > 0 && (
                                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                            ฿{parseFloat(activity.estimatedCost).toLocaleString()}
                                        </span>
                                    )}
                                </div>
                                {activity.description && (
                                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                                )}
                                <div className="mt-2 text-xs text-gray-400">
                                    วันที่ {activity.day} (นับจากวันปลูก)
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* End Node */}
                    <div className="flex gap-4">
                        <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 border-2 border-gray-400 flex items-center justify-center text-xs font-bold text-gray-600">
                            {totalDays}
                        </div>
                        <div className="pt-1">
                            <h4 className="font-bold text-gray-900">สิ้นสุดรอบปลูก</h4>
                            <p className="text-sm text-gray-500">เก็บเกี่ยวผลผลิต (ประมาณการ)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
