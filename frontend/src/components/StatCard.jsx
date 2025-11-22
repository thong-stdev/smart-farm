export default function StatCard({ icon, label, value, color = 'bg-primary' }) {
    return (
        <div className="rounded-lg bg-card p-4 shadow-sm border">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
                <div className={`${color} w-12 h-12 rounded-full flex items-center justify-center text-2xl`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
