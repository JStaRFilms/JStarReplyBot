import { useState } from 'react'
import { Zap, AlertCircle, MinusCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { QueueProcessedEvent } from '../../../shared/types'

type LiveFeedProps = {
    events: QueueProcessedEvent[]
}

export function LiveFeed({ events }: LiveFeedProps) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

    const toggleExpand = (index: number) => {
        setExpandedIndex(prev => prev === index ? null : index)
    }

    if (events.length === 0) {
        return (
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Activity Yet</h3>
                <p className="text-sm text-slate-500 max-w-[200px] mt-1">Waiting for customers to send messages to the bot.</p>
            </div>
        )
    }

    return (
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 rounded-2xl p-1 min-h-[400px] max-h-[600px] overflow-y-auto">
            {events.map((event, index) => {
                const isExpanded = expandedIndex === index

                return (
                    <div
                        key={index}
                        onClick={() => toggleExpand(index)}
                        className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-all rounded-xl cursor-pointer group border-b border-transparent hover:border-slate-100 dark:hover:border-white/5 last:border-0"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 dark:text-slate-300">
                                    {event.contactName?.substring(0, 2).toUpperCase() || 'UK'}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{event.contactName || event.contactId}</h4>
                                    <p className="text-xs text-slate-500">
                                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Status Badge */}
                                {event.status === 'sent' && (
                                    <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded uppercase flex items-center gap-1">
                                        <Zap className="w-3 h-3" /> Replied
                                    </span>
                                )}
                                {event.status === 'drafted' && (
                                    <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-1 rounded uppercase flex items-center gap-1">
                                        <FileText className="w-3 h-3" /> Drafted
                                    </span>
                                )}
                                {event.status === 'failed' && (
                                    <span className="text-[10px] font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 px-2 py-1 rounded uppercase flex items-center gap-1" title={event.error}>
                                        <AlertCircle className="w-3 h-3" /> Failed
                                    </span>
                                )}
                                {event.status === 'skipped' && (
                                    <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 px-2 py-1 rounded uppercase flex items-center gap-1" title={event.error}>
                                        <MinusCircle className="w-3 h-3" /> Skipped
                                    </span>
                                )}
                                {/* Expand/Collapse Icon */}
                                {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-slate-400" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                                )}
                            </div>
                        </div>

                        {/* User's "Grouped" Messages Preview */}
                        <div className={`ml-13 pl-4 border-l-2 ${event.status === 'failed' ? 'border-rose-200 dark:border-rose-500/30' : 'border-indigo-200 dark:border-indigo-500/30'} space-y-2 py-1`}>
                            {isExpanded ? (
                                <>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                        {event.messageCount} Message{event.messageCount > 1 ? 's' : ''} Received:
                                    </p>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-100 dark:border-white/5">
                                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                                            "{event.aggregatedPrompt}"
                                        </p>
                                    </div>

                                    {/* AI Reply Section */}
                                    {event.reply && (
                                        <>
                                            <p className="text-xs font-medium text-indigo-500 dark:text-indigo-400 uppercase tracking-wide mt-3">
                                                🤖 Bot Reply:
                                            </p>
                                            <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-lg p-3 border border-indigo-100 dark:border-indigo-500/20">
                                                <p className="text-sm text-indigo-700 dark:text-indigo-300 whitespace-pre-wrap break-words">
                                                    {event.reply}
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    {event.error && (
                                        <div className="bg-rose-50 dark:bg-rose-500/10 rounded-lg p-3 border border-rose-100 dark:border-rose-500/20">
                                            <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                                                ⚠️ Error: {event.error}
                                            </p>
                                        </div>
                                    )}
                                    <p className="text-[10px] text-slate-400 pt-1">
                                        Click to collapse
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                                        Matched {event.messageCount} messages...
                                    </p>
                                    <p className="text-xs text-slate-500 truncate opacity-75">
                                        "{event.aggregatedPrompt.substring(0, 80)}{event.aggregatedPrompt.length > 80 ? '...' : ''}"
                                    </p>
                                    {event.error && (
                                        <p className="text-xs text-rose-500 font-medium">Error: {event.error}</p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
