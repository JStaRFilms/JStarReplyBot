import { useState } from 'react'
import { StyleProfile } from '../../../../shared/types'

export function StyleOnboarding({ onComplete }: { onComplete: () => void }) {
    const [step, setStep] = useState(1)
    const [samples, setSamples] = useState(['', '', ''])
    const [emojiUsage, setEmojiUsage] = useState<StyleProfile['global']['patterns']['emojiUsage']>('moderate')
    const [sentenceStyle, setSentenceStyle] = useState<StyleProfile['global']['patterns']['sentenceStyle']>('medium')
    const [saving, setSaving] = useState(false)

    const handleSampleChange = (index: number, value: string) => {
        const newSamples = [...samples]
        newSamples[index] = value
        setSamples(newSamples)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            // save samples
            const validSamples = samples.filter(s => s.trim().length > 0)

            // Construct updates
            const updates = {
                global: {
                    patterns: {
                        emojiUsage,
                        sentenceStyle,
                        endsWithPeriod: false // Default to casual
                    },
                    sampleMessages: validSamples
                }
            }

            await window.electron.updateStyleProfile(updates)
            onComplete()
        } catch (err) {
            console.error('Failed to save wizard:', err)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="bg-slate-50 dark:bg-surface-800 p-6 rounded-xl border border-brand-500/20 shadow-lg">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Style Setup Wizard</h3>
                <p className="text-sm text-slate-500">Teach the bot your vibe in 30 seconds.</p>
            </div>

            {step === 1 && (
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">How many emojis do you use?</label>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                            {(['none', 'light', 'moderate', 'heavy'] as const).map(level => (
                                <button
                                    key={level}
                                    onClick={() => setEmojiUsage(level)}
                                    className={`p-2 rounded-lg text-xs capitalize border ${emojiUsage === level
                                            ? 'bg-brand-500 text-white border-brand-500'
                                            : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10'
                                        }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sentence Length?</label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {(['short', 'medium', 'long'] as const).map(style => (
                                <button
                                    key={style}
                                    onClick={() => setSentenceStyle(style)}
                                    className={`p-2 rounded-lg text-xs capitalize border ${sentenceStyle === style
                                            ? 'bg-brand-500 text-white border-brand-500'
                                            : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10'
                                        }`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => setStep(2)}
                        className="w-full py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-500 transition-colors"
                    >
                        Next: Add Samples
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Paste 3 messages you've sent recently:</label>
                        <div className="space-y-2 mt-2">
                            {samples.map((s, i) => (
                                <input
                                    key={i}
                                    type="text"
                                    value={s}
                                    onChange={(e) => handleSampleChange(i, e.target.value)}
                                    placeholder={`Message ${i + 1} (e.g. "On my way!" or "No worries, talk soon.")`}
                                    className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setStep(1)}
                            className="flex-1 py-2 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-500 transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Finish Setup'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
