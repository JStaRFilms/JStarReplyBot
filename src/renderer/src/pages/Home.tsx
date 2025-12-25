import { useEffect, useState } from 'react'
import { Users, MessageCircle, Clock, Target, Edit3, X, AlertOctagon, Trash2 } from 'lucide-react'
import { useStatsStore, useDraftsStore, useSettingsStore, useFeedStore } from '../store'
import { MetricCard } from '../components/MetricCard'
import { SmartQueueWidget } from '../components/SmartQueueWidget'
import { LiveFeed } from '../components/LiveFeed'
import { QueueBufferItem, QueueProcessedEvent } from '../../../shared/types'

export default function Home() {
    const { stats } = useStatsStore()
    const { drafts, removeDraft } = useDraftsStore()
    const { settings } = useSettingsStore()
    const { events: processedEvents, addEvent, clearFeed } = useFeedStore()

    const [queueItems, setQueueItems] = useState<QueueBufferItem[]>([])

    // Listen for Queue Events
    useEffect(() => {
        const unsubUpdate = window.electron.onQueueUpdate((items: QueueBufferItem[]) => {
            setQueueItems(items)
        })

        const unsubProcessed = window.electron.onQueueProcessed((event: QueueProcessedEvent) => {
            if (event.status === 'drafted') return // Don't show drafts in feed until sent
            addEvent(event)
        })

        return () => {
            unsubUpdate()
            unsubProcessed()
        }
    }, [])

    const handleApproveDraft = async (id: string, text: string) => {
        await window.electron.sendDraft(id, text)
        removeDraft(id)
    }

    const handleDiscardDraft = async (id: string) => {
        await window.electron.discardDraft(id)
        removeDraft(id)
    }

    const formatDuration = (totalMinutes: number) => {
        if (totalMinutes < 1) return '0m'

        const y = Math.floor(totalMinutes / 525600)
        let rem = totalMinutes % 525600

        const mo = Math.floor(rem / 43200)
        rem %= 43200

        const w = Math.floor(rem / 10080)
        rem %= 10080

        const d = Math.floor(rem / 1440)
        rem %= 1440

        const h = Math.floor(rem / 60)
        const m = Math.floor(rem % 60)

        // Show top 2 significant non-zero units
        if (y > 0) return `${y}y ${mo}mo`
        if (mo > 0) return `${mo}mo ${d}d` // Skip weeks for month view for cleaner "1mo 5d"
        if (w > 0) return `${w}w ${d}d`
        if (d > 0) return `${d}d ${h}h`
        if (h > 0) return `${h}h ${m}m`
        return `${m}m`
    }

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 5) return { text: 'Late Night Hustle', icon: '🌚' }
        if (hour < 12) return { text: 'Good Morning', icon: '☀️' }
        if (hour < 17) return { text: 'Good Afternoon', icon: '🌤️' }
        if (hour < 22) return { text: 'Good Evening', icon: '🌙' }
        return { text: 'Good Night', icon: '✨' }
    }

    const greeting = getGreeting()
    const displayName = settings?.businessProfile?.name || 'Partner'

    return (
        <div className="space-y-8 max-w-7xl mx-auto">

            {/* Greeting */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {greeting.text}, {displayName} <span className="text-amber-500">{greeting.icon}</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400">Your assistant is handling customers while you work.</p>
            </div>

            {/* Metrics (Compact) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    label="Customers Helped"
                    value={stats.messagesSent > 0 ? Math.floor(stats.messagesSent / 2) : 0} // Approx logic
                    icon={Users}
                    trend="+4 Today"
                    trendColor="emerald"
                />
                <MetricCard
                    label="Smart Replies"
                    value={stats.messagesSent}
                    icon={MessageCircle}
                />
                <MetricCard
                    label="Time Saved"
                    value={formatDuration(Math.floor(stats.messagesSent * 1.5))} // Approx 1.5m per msg
                    icon={Clock}
                />
                <MetricCard
                    label="Leads Captured"
                    value={stats.leadsCaptured || 0}
                    icon={Target}
                    trend="High Value"
                    trendColor="amber"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left: Live Feed (2/3) */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-brand-500" /> Recent Conversations
                        </h3>
                        {processedEvents.length > 0 && (
                            <button
                                onClick={clearFeed}
                                className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
                            >
                                <Trash2 className="w-3 h-3" /> Clear History
                            </button>
                        )}
                    </div>
                    <LiveFeed events={processedEvents} edition={settings?.edition} />
                </div>

                {/* Right: Widgets (1/3) */}
                <div className="space-y-8">

                    {/* Smart Queue */}
                    <SmartQueueWidget items={queueItems} />

                    {/* Drafts Widget */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <Edit3 className="w-4 h-4 text-indigo-500" /> Needs Approval
                            </h3>
                            {drafts.length > 0 && (
                                <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {drafts.length}
                                </span>
                            )}
                        </div>

                        {drafts.length === 0 ? (
                            <div className="glass p-6 rounded-xl text-center border-dashed border-2 border-slate-200 dark:border-white/5">
                                <p className="text-slate-400 text-sm">No drafts pending approval.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                                {drafts.map(draft => (
                                    <div key={draft.id} className="glass p-5 rounded-xl border-l-4 border-l-indigo-500 relative">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                                {draft.sentiment === 'high' && <AlertOctagon className="w-3 h-3 text-rose-500" />}
                                                {draft.isHandover && (
                                                    <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded animate-pulse">
                                                        HUMAN NEEDED
                                                    </span>
                                                )}
                                                {draft.contactName}
                                            </span>
                                            <button
                                                onClick={() => handleDiscardDraft(draft.id)}
                                                className="text-slate-400 hover:text-rose-500 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="mb-3">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">User asked:</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2">
                                                "{draft.query}"
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <textarea
                                                className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 text-xs border border-slate-200 dark:border-white/10 focus:ring-2 ring-indigo-500/20 outline-none transition-all resize-none"
                                                rows={3}
                                                defaultValue={draft.proposedReply}
                                                id={`text-${draft.id}`}
                                            />
                                            <button
                                                onClick={() => {
                                                    const el = document.getElementById(`text-${draft.id}`) as HTMLTextAreaElement
                                                    handleApproveDraft(draft.id, el.value)
                                                }}
                                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-95"
                                            >
                                                Approve & Send
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}
