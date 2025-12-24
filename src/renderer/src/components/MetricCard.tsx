import { LucideIcon } from 'lucide-react'

type MetricCardProps = {
    label: string
    value: string | number
    icon: LucideIcon
    trend?: string
    trendColor?: 'emerald' | 'amber' | 'rose' | 'brand'
}

export function MetricCard({ label, value, icon: Icon, trend, trendColor = 'emerald' }: MetricCardProps) {
    const trendColors = {
        emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
        amber: 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
        rose: 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
        brand: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
    }

    return (
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 p-4 rounded-xl shadow-sm transition-all hover:border-indigo-500/30">
            <div className="flex justify-between items-start mb-2">
                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-md text-indigo-600 dark:text-indigo-400">
                    <Icon className="w-4 h-4" />
                </div>
                {trend && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${trendColors[trendColor]}`}>
                        {trend}
                    </span>
                )}
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
        </div>
    )
}
