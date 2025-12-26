import { useState } from 'react'
import { Brain, ToggleRight, ToggleLeft } from 'lucide-react'

interface MoodDetectionPanelProps {
    moodDetection: {
        enabled: boolean
        sensitivity: 'low' | 'medium' | 'high'
        autoRespond: boolean
    }
    onToggleEnabled: (enabled: boolean) => void
    onSetSensitivity: (sensitivity: 'low' | 'medium' | 'high') => void
    onToggleAutoRespond: (autoRespond: boolean) => void
}

export function MoodDetectionPanel({
    moodDetection,
    onToggleEnabled,
    onSetSensitivity,
    onToggleAutoRespond
}: MoodDetectionPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    const sensitivityOptions = [
        { value: 'low', label: 'Low', description: 'Minimal mood analysis' },
        { value: 'medium', label: 'Medium', description: 'Balanced analysis' },
        { value: 'high', label: 'High', description: 'Detailed mood analysis' }
    ]

    return (
        <div className="space-y-6">
            {/* Main Toggle */}
            <div className="glass p-6 rounded-2xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Brain className="w-6 h-6 text-brand-600" />
                        <div>
                            <h3 className="font-medium text-slate-900 dark:text-white">Mood Detection</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Analyze the emotional tone of incoming messages
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => onToggleEnabled(!moodDetection.enabled)}
                        className={`relative inline-flex items-center w-12 h-6 rounded-full transition-colors ${moodDetection.enabled ? 'bg-brand-500' : 'bg-slate-300 dark:bg-surface-800'}`}
                    >
                        <span
                            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${moodDetection.enabled ? 'translate-x-7' : 'translate-x-1'}`}
                        />
                    </button>
                </div>
            </div>

            {/* Advanced Settings */}
            {moodDetection.enabled && (
                <div className="glass p-6 rounded-2xl space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium text-slate-900 dark:text-white">Advanced Settings</h3>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                        >
                            {isExpanded ? 'Hide' : 'Show'} Details
                        </button>
                    </div>

                    {/* Sensitivity */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sensitivity</label>
                        <div className="grid grid-cols-3 gap-2">
                            {sensitivityOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => onSetSensitivity(option.value as any)}
                                    className={`p-4 rounded-lg text-left border transition-all ${moodDetection.sensitivity === option.value
                                            ? 'bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400'
                                            : 'bg-slate-50 dark:bg-surface-800 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-xs text-slate-500 mt-1">{option.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Auto-Respond Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-surface-800 rounded-lg">
                        <div>
                            <h4 className="font-medium text-slate-900 dark:text-white">Auto-Respond to Mood</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Automatically adjust responses based on detected mood
                            </p>
                        </div>
                        <button
                            onClick={() => onToggleAutoRespond(!moodDetection.autoRespond)}
                            className={`relative inline-flex items-center w-12 h-6 rounded-full transition-colors ${moodDetection.autoRespond ? 'bg-brand-500' : 'bg-slate-300 dark:bg-surface-800'}`}
                        >
                            <span
                                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${moodDetection.autoRespond ? 'translate-x-7' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>

                    {/* Details */}
                    {isExpanded && (
                        <div className="space-y-4 p-4 bg-slate-50 dark:bg-surface-800 rounded-lg">
                            <h4 className="font-medium text-slate-900 dark:text-white">How It Works</h4>
                            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                                <p>
                                    <strong>Low Sensitivity:</strong> Only detects obvious emotional cues.
                                    Less likely to misinterpret neutral messages as emotional.
                                </p>
                                <p>
                                    <strong>Medium Sensitivity:</strong> Balanced approach that catches
                                    most emotional content while maintaining accuracy.
                                </p>
                                <p>
                                    <strong>High Sensitivity:</strong> Detailed analysis that may detect
                                    subtle emotional undertones. More prone to false positives.
                                </p>
                                <p>
                                    <strong>Auto-Respond:</strong> When enabled, the AI will automatically
                                    adjust its tone and response style based on the detected mood.
                                </p>
                            </div>

                            <div className="text-xs text-slate-500">
                                Note: Mood detection uses advanced AI analysis and may require additional
                                processing time for messages.
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}