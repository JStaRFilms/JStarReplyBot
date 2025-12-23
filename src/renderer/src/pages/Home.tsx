import { MessageSquare, Clock, Target, TrendingUp, Activity, Edit3, Trash2, Bot, Inbox } from 'lucide-react'
import { useStatsStore, useDraftsStore, useActivityStore } from '../store'
import { useState } from 'react'

export default function HomePage() {
    const { stats } = useStatsStore()
    const { drafts, removeDraft, updateDraft } = useDraftsStore()
    const { activities } = useActivityStore()

    const formatTime = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    }

    const handleSendDraft = async (draftId: string, text: string) => {
        const res = await window.electron.sendDraft(draftId, text)
        if (res.success) {
            removeDraft(draftId)
        }
    }

    const handleDiscardDraft = async (draftId: string) => {
        const res = await window.electron.discardDraft(draftId)
        if (res.success) {
            removeDraft(draftId)
        }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={MessageSquare}
                    label="Messages Sent"
                    value={stats.messagesSent.toString()}
                    trend="+12% today"
                    trendUp
                />
                <StatCard
                    icon={Clock}
                    label="Time Saved"
                    value={formatTime(stats.timeSavedMinutes)}
                    subtitle="Based on 1m per reply"
                />
                <StatCard
                    icon={Target}
                    label="Leads Captured"
                    value={stats.leadsCaptured.toString()}
                    trend="New opportunities"
                    trendUp
                />
            </div>

            {/* Layout: 2/3 Main Feed, 1/3 Draft Queue */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Activity Feed */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-brand-500" />
                        Live Activity
                    </h2>
                    <div className="glass rounded-2xl divide-y divide-slate-100 dark:divide-white/5 min-h-[400px]">
                        {activities.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
                                <Inbox className="w-12 h-12 mb-3 opacity-30" />
                                <p className="text-sm font-medium">No activity yet</p>
                                <p className="text-xs mt-1">Messages will appear here once the bot responds</p>
                            </div>
                        ) : (
                            activities.map(activity => (
                                <ActivityItem
                                    key={activity.id}
                                    contact={activity.contact}
                                    time={activity.time}
                                    query={activity.query}
                                    response={activity.response}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Draft Queue */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <Edit3 className="w-5 h-5 text-amber-500" />
                            Draft Queue
                        </h2>
                        {drafts.length > 0 && (
                            <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500 text-xs font-bold px-2 py-0.5 rounded-full">
                                {drafts.length}
                            </span>
                        )}
                    </div>

                    <div className="glass rounded-xl p-1 max-h-[600px] overflow-y-auto space-y-3">
                        {drafts.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <Edit3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No pending drafts</p>
                            </div>
                        ) : (
                            drafts.map(draft => (
                                <DraftCard
                                    key={draft.id}
                                    draft={draft}
                                    onSend={(text) => handleSendDraft(draft.id, text)}
                                    onDiscard={() => handleDiscardDraft(draft.id)}
                                    onEdit={(text) => updateDraft(draft.id, text)}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({
    icon: Icon,
    label,
    value,
    trend,
    trendUp,
    subtitle
}: {
    icon: typeof MessageSquare
    label: string
    value: string
    trend?: string
    trendUp?: boolean
    subtitle?: string
}) {
    return (
        <div className="glass p-6 rounded-2xl relative overflow-hidden group">
            <Icon className="absolute top-4 right-4 w-6 h-6 text-brand-400/20 group-hover:text-brand-400 transition-colors" />
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{value}</h3>
            {trend && (
                <span className={`text-xs flex items-center gap-1 mt-2 ${trendUp ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {trendUp && <TrendingUp className="w-3 h-3" />}
                    {trend}
                </span>
            )}
            {subtitle && (
                <span className="text-xs text-slate-400 mt-2 block">{subtitle}</span>
            )}
        </div>
    )
}

function ActivityItem({ contact, time, query, response }: {
    contact: string
    time: string
    query: string
    response: string
}) {
    return (
        <div className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
            <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-slate-900 dark:text-white text-sm">{contact}</span>
                <span className="text-xs text-slate-400">{time}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 italic">"{query}"</p>
            <div className="bg-brand-50 dark:bg-brand-500/10 p-3 rounded-lg border border-brand-100 dark:border-brand-500/20">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                    <Bot className="w-3 h-3 inline mr-1 text-brand-500" />
                    {response}
                </p>
            </div>
        </div>
    )
}

function DraftCard({ draft, onSend, onDiscard, onEdit }: {
    draft: { id: string; contactName: string; query: string; proposedReply: string; sentiment: string; createdAt: number }
    onSend: (text: string) => void
    onDiscard: () => void
    onEdit: (text: string) => void
}) {
    const [text, setText] = useState(draft.proposedReply)

    const timeAgo = () => {
        const diff = Date.now() - draft.createdAt
        if (diff < 60000) return 'Just now'
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
        return `${Math.floor(diff / 3600000)}h ago`
    }

    return (
        <div className="bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-white/5">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">{draft.contactName}</span>
                <span className="text-[10px] text-slate-400">{timeAgo()}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 border-l-2 border-slate-300 dark:border-slate-700 pl-2">
                "{draft.query}"
            </p>

            {draft.sentiment === 'high' && (
                <div className="w-full bg-amber-500/10 text-amber-500 p-2 rounded text-[10px] mb-2 flex items-center gap-1">
                    ⚠️ High Sentiment Risk
                </div>
            )}

            <textarea
                className="w-full bg-slate-100 dark:bg-black/30 text-sm text-slate-800 dark:text-slate-200 p-2 rounded mb-3 border border-transparent focus:border-brand-500 outline-none text-xs resize-none"
                rows={3}
                value={text}
                onChange={(e) => {
                    setText(e.target.value)
                    onEdit(e.target.value)
                }}
            />

            <div className="flex gap-2">
                <button
                    onClick={() => onSend(text)}
                    className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-1.5 rounded text-xs font-medium transition-colors"
                >
                    Send
                </button>
                <button
                    onClick={onDiscard}
                    className="px-3 py-1.5 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-rose-500 rounded text-xs transition-colors"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>
        </div>
    )
}
