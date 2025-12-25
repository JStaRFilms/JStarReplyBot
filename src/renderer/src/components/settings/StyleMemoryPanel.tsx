import { useState, useEffect } from 'react'
import { Trash2, RefreshCw, Wand2 } from 'lucide-react'
import type { StyleProfile } from '../../../../shared/types'
import { StyleOnboarding } from './StyleOnboarding'

export function StyleMemoryPanel() {
    const [profile, setProfile] = useState<StyleProfile | null>(null)
    const [loading, setLoading] = useState(false)
    const [showWizard, setShowWizard] = useState(false)

    const fetchProfile = async () => {
        setLoading(true)
        try {
            const res = await window.electron.getStyleProfile()
            if (res.success && res.data) {
                setProfile(res.data)
            }
        } catch (err) {
            console.error('Failed to fetch style profile:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProfile()
    }, [])

    const handleDelete = async (type: 'vocabulary' | 'sample', value: string) => {
        if (!confirm(`Are you sure you want to delete "${value}"?`)) return

        // Optimistic update
        if (profile) {
            if (type === 'vocabulary') {
                setProfile({
                    ...profile,
                    global: {
                        ...profile.global,
                        vocabulary: profile.global.vocabulary.filter(v => v !== value)
                    }
                })
            }
        }

        try {
            await window.electron.deleteStyleItem(type, value)
        } catch (err) {
            console.error('Failed to delete item:', err)
            // Revert would go here in a robust app
            fetchProfile()
        }
    }

    if (!profile) return null

    if (showWizard) {
        return <StyleOnboarding onComplete={() => { setShowWizard(false); fetchProfile(); }} />
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">Style Memory</h3>
                    <p className="text-xs text-slate-500">
                        The bot analyzes your sent messages to learn your style.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowWizard(true)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-600 hover:bg-brand-500/20 transition-colors text-xs font-medium"
                    >
                        <Wand2 className="w-3 h-3" />
                        Tune Style
                    </button>
                    <button
                        onClick={fetchProfile}
                        className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors ${loading ? 'animate-spin' : ''}`}
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4 text-slate-500" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Patterns Card */}
                <div className="glass p-4 rounded-xl border border-slate-200 dark:border-white/5">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Detected Patterns</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Emoji Usage</span>
                            <span className="font-medium text-slate-900 dark:text-white capitalize">{profile.global.patterns.emojiUsage}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Sentence Length</span>
                            <span className="font-medium text-slate-900 dark:text-white capitalize">{profile.global.patterns.sentenceStyle}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Ends with Period</span>
                            <span className="font-medium text-slate-900 dark:text-white">{profile.global.patterns.endsWithPeriod ? 'Yes' : 'No'}</span>
                        </div>
                    </div>
                </div>

                {/* Vocabulary Card */}
                <div className="glass p-4 rounded-xl border border-slate-200 dark:border-white/5">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Frequent Vocabulary</h4>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                        {profile.global.vocabulary.length === 0 && (
                            <span className="text-xs text-slate-400 italic">No patterns learned yet.</span>
                        )}
                        {profile.global.vocabulary.map(word => (
                            <div key={word} className="flex items-center gap-1 px-2 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 text-xs">
                                <span>{word}</span>
                                <button onClick={() => handleDelete('vocabulary', word)} className="hover:text-red-500">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sample Messages */}
            <div className="glass p-4 rounded-xl border border-slate-200 dark:border-white/5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Learning Samples (Last 20)</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {profile.global.sampleMessages.length === 0 && (
                        <div className="text-center py-4 text-xs text-slate-400 italic">
                            Send messages from your phone to start training the bot.
                        </div>
                    )}
                    {profile.global.sampleMessages.map((msg, i) => (
                        <div key={i} className="p-2 rounded bg-slate-50/50 dark:bg-surface-800/50 border border-slate-100 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300 italic">
                            "{msg}"
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
