export default function CycleCard({ cycle }) {
    // Calculate days since planting
    const startDate = new Date(cycle.startDate);
    const today = new Date();
    const daysSincePlanting = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

    // Calculate days until harvest
    const harvestDate = cycle.expectedHarvestDate ? new Date(cycle.expectedHarvestDate) : null;
    const daysUntilHarvest = harvestDate
        ? Math.ceil((harvestDate - today) / (1000 * 60 * 60 * 24))
        : null;

    // Calculate progress (rough estimate based on days)
    const totalDays = cycle.standardPlan?.totalDays || 90;
    const progress = Math.min(Math.round((daysSincePlanting / totalDays) * 100), 100);

    return (
        <div className="rounded-lg bg-card p-4 shadow-sm border">
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                    <h3 className="font-bold text-lg text-primary">
                        {cycle.plotName || 'Unknown Plot'}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                        <span>{cycle.plotAreaRai} ไร่</span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        <span>{cycle.cropVariety?.name || 'Unknown Crop'}</span>
                    </p>
                </div>
                <span className="text-2xl">🌱</span>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ปลูกมาแล้ว</span>
                    <span className="font-medium">{daysSincePlanting} วัน</span>
                </div>

                {daysUntilHarvest !== null && (
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">เก็บเกี่ยวใน</span>
                        <span className="font-medium text-green-600">{daysUntilHarvest} วัน</span>
                    </div>
                )}

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-xs text-muted-foreground text-right">{progress}% เสร็จสิ้น</p>
            </div>
        </div>
    );
}
