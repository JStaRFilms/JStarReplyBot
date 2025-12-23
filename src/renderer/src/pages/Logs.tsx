import { ArrowLeft } from 'lucide-react'
import { useAppStore, useLogsStore } from '../store'
import { useEffect, useRef } from 'react'
import type { LogLevel } from '../../../shared/types'

export default function LogsPage() {
    const { setActivePage } = useAppStore()
    const { logs } = useLogsStore()
    const containerRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom on new logs
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
    }, [logs])

    const handleExport = async () => {
        const res = await window.electron.exportLogs()
        if (res.success && res.data) {
            alert(`Logs exported to: ${res.data}`)
        }
    }

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    const getLevelColor = (level: LogLevel) => {
        switch (level) {
            case 'INFO': return 'text-emerald-600 dark:text-emerald-500'
            case 'WARN': return 'text-amber-600 dark:text-amber-500'
            case 'ERROR': return 'text-rose-600 dark:text-rose-500'
            case 'DEBUG': return 'text-slate-500'
            case 'AI': return 'text-brand-600 dark:text-blue-500'
            default: return 'text-slate-500'
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-200px)]">
            {/* Header */}
            <nav className="flex items-center justify-between mb-8">
                <button
                    onClick={() => setActivePage('home')}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Dashboard
                </button>
                <div className="flex gap-2">
                    <button className="bg-brand-600/10 text-brand-600 dark:text-brand-400 px-3 py-1.5 rounded-lg text-xs font-medium border border-brand-500/20">
                        All Logs
                    </button>
                    <button className="text-slate-500 hover:bg-slate-200 dark:hover:bg-white/5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                        Errors Only
                    </button>
                    <button
                        onClick={handleExport}
                        className="text-slate-500 hover:bg-slate-200 dark:hover:bg-white/5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    >
                        Export .log
                    </button>
                </div>
            </nav>

            {/* Terminal Window */}
            <div className="flex-1 glass rounded-xl overflow-hidden flex flex-col">
                {/* Title Bar */}
                <div className="bg-slate-200 dark:bg-black/40 px-4 py-2 flex items-center gap-2 border-b border-white/5">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-[10px] ml-2 text-slate-500 font-mono">system_logs.txt</span>
                </div>

                {/* Log Content */}
                <div
                    ref={containerRef}
                    className="flex-1 p-6 font-mono text-xs md:text-sm overflow-y-auto space-y-1 bg-slate-50/80 dark:bg-[#0c0c0c]/80 text-slate-700 dark:text-slate-300"
                >
                    {logs.length === 0 ? (
                        <div className="text-slate-400 text-center py-8">
                            No logs yet. Start the bot to see activity.
                        </div>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className={`flex gap-3 ${log.level === 'DEBUG' ? 'opacity-50' : ''}`}>
                                <span className="text-slate-400 dark:text-slate-600 shrink-0">
                                    [{formatTime(log.timestamp)}]
                                </span>
                                <span className={`font-semibold ${getLevelColor(log.level)}`}>
                                    {log.level}
                                </span>
                                <span>{log.message}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
