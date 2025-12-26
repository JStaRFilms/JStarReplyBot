import { useState } from 'react'
import { BarChart3, Eye, EyeOff } from 'lucide-react'

interface PersonalAnalyticsPanelProps {
    analytics: {
        enabled: boolean
        showDailyStats: boolean
        showWeeklyStats: boolean
        showMonthlyStats: boolean
    }
    onToggleEnabled: (enabled: boolean) => void
    onToggleDaily: (show: boolean) => void
    onToggleWeekly: (show: boolean) => void
    onToggleMonthly: (show: boolean) => void
}

export function PersonalAnalyticsPanel({
    analytics,
    onToggleEnabled,
    onToggleDaily,
    onToggleWeekly,
    onToggleMonthly
}: PersonalAnalyticsPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    const statsData = {
        daily: {
            messagesSent: 15,
            timeSaved: 45,
            activeHours: '2-4 PM'
        },
        weekly: {
            messagesSent: 89,
            timeSaved: 280,
            mostActiveDay: 'Wednesday'
        },
        monthly: {
            messagesSent: 347,
            timeSaved: 1250,
            avgResponseTime: '2.3 minutes'
        }
    }

    const StatCard = ({ title, data, visible }: { title: string; data: any; visible: boolean }) => (
        <div className={`p-4 rounded-lg border ${visible ? 'border-slate-200 dark:border-white/10 bg-white dark:bg-surface-800' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-900 opacity-50'}`}>
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-slate-900 dark:text-white">{title}</h4>
                {visible ? (
                    <Eye className="w-4 h-4 text-slate-400" />
                ) : (
                    <EyeOff className="w-4 h-4 text-slate-400" />
                )}
            </div>
            <div className="space-y-1 text-sm">
                {Object.entries(data).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="font-medium text-slate-900 dark:text-white">{String(value)}</span>
                    </div>
                ))}
            </div>
        </div>
    )

    return (
        <div className="space-y-6">
            {/* Main Toggle */}
            <div className="glass p-6 rounded-2xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="w-6 h-6 text-brand-600" />
                        <div>
                            <h3 className="font-medium text-slate-900 dark:text-white">Personal Analytics</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Track your usage patterns and statistics
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => onToggleEnabled(!analytics.enabled)}
                        className={`relative inline-flex items-center w-12 h-6 rounded-full transition-colors ${analytics.enabled ? 'bg-brand-500' : 'bg-slate-300 dark:bg-surface-800'}`}
                    >
                        <span
                            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${analytics.enabled ? 'translate-x-7' : 'translate-x-1'}`}
                        />
                    </button>
                </div>
            </div>

            {/* Display Options */}
            {analytics.enabled && (
                <div className="glass p-6 rounded-2xl space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium text-slate-900 dark:text-white">Display Options</h3>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                        >
                            {isExpanded ? 'Hide' : 'Show'} Sample Data
                        </button>
                    </div>

                    <div className="space-y-4">
                        <ToggleOption
                            label="Show Daily Stats"
                            description="Display daily usage statistics"
                            enabled={analytics.showDailyStats}
                            onToggle={onToggleDaily}
                        />
                        <ToggleOption
                            label="Show Weekly Stats"
                            description="Display weekly usage statistics"
                            enabled={analytics.showWeeklyStats}
                            onToggle={onToggleWeekly}
                        />
                        <ToggleOption
                            label="Show Monthly Stats"
                            description="Display monthly usage statistics"
                            enabled={analytics.showMonthlyStats}
                            onToggle={onToggleMonthly}
                        />
                    </div>

                    {/* Sample Data Preview */}
                    {isExpanded && (
                        <div className="space-y-4">
                            <h4 className="font-medium text-slate-900 dark:text-white">Sample Analytics Data</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <StatCard title="Daily Stats" data={statsData.daily} visible={analytics.showDailyStats} />
                                <StatCard title="Weekly Stats" data={statsData.weekly} visible={analytics.showWeeklyStats} />
                                <StatCard title="Monthly Stats" data={statsData.monthly} visible={analytics.showMonthlyStats} />
                            </div>
                            <div className="text-xs text-slate-500 bg-slate-50 dark:bg-surface-800 p-3 rounded-lg">
                                Note: This is sample data. Real analytics will be populated based on your actual usage.
                                Analytics data is stored locally and respects your privacy settings.
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// Helper component for toggle options
function ToggleOption({
    label,
    description,
    enabled,
    onToggle
}: {
    label: string
    description: string
    enabled: boolean
    onToggle: (enabled: boolean) => void
}) {
    return (
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-surface-800 rounded-lg">
            <div>
                <h4 className="font-medium text-slate-900 dark:text-white">{label}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
            </div>
            <button
                onClick={() => onToggle(!enabled)}
                className={`relative inline-flex items-center w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-brand-500' : 'bg-slate-300 dark:bg-surface-800'}`}
            >
                <span
                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-7' : 'translate-x-1'}`}
                />
            </button>
        </div>
    )
}