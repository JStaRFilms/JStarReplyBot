import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { QueueBufferItem } from '../../../shared/types'

type SmartQueueWidgetProps = {
    items: QueueBufferItem[]
}

export function SmartQueueWidget({ items }: SmartQueueWidgetProps) {
    const [now, setNow] = useState(Date.now())

    // Update timer every second
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(interval)
    }, [])

    if (items.length === 0) {
        return (
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Queue Empty</h3>
                <p className="text-xs text-slate-500">Bot is ready for new messages.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Waiting for Reply</h3>
            </div>

            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 rounded-xl p-4 space-y-3">
                {items.map(item => {
                    const remaining = Math.max(0, Math.ceil((item.expiresAt - now) / 1000))
                    const progress = Math.min(100, (remaining / 10) * 100) // Assumes 10s max

                    return (
                        <div key={item.contactId} className="relative group">
                            <div className="flex items-center justify-between p-2 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center font-bold text-amber-600 dark:text-amber-500 text-xs">
                                            {item.contactName?.substring(0, 2).toUpperCase() || 'UNKNOWN'}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-0.5">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                                            {item.contactName || item.contactId}
                                        </p>
                                        <p className="text-xs text-slate-500 animate-pulse">Buffering...</p>
                                    </div>
                                </div>
                                <span className="text-xs font-mono text-slate-400 font-medium">
                                    {remaining}s
                                </span>
                            </div>

                            {/* Progress Bar Background */}
                            <div
                                className="absolute bottom-0 left-0 h-0.5 bg-amber-500/50 transition-all duration-1000 ease-linear"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    )
                })}
            </div>

            <p className="text-[10px] text-slate-400 text-center">Bot waits 10s for customer to finish typing.</p>
        </div>
    )
}
