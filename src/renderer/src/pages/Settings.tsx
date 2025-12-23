import { ArrowLeft } from 'lucide-react'
import { useAppStore, useSettingsStore } from '../store'
import { useState } from 'react'
import type { Settings } from '../../../shared/types'

export default function SettingsPage() {
    const { setActivePage } = useAppStore()
    const { settings, updateSettings } = useSettingsStore()
    const [licenseKey, setLicenseKey] = useState(settings?.licenseKey || '')
    const [isValidating, setIsValidating] = useState(false)
    const [systemPrompt, setSystemPrompt] = useState(settings?.systemPrompt || '')

    const handleToggle = async (key: keyof Settings, value: boolean) => {
        if (!settings) return
        updateSettings({ [key]: value })
        await window.electron.saveSettings({ [key]: value })
    }

    const handleSave = async () => {
        try {
            const res = await window.electron.saveSettings({
                systemPrompt,
                licenseKey
            })
            if (res.success) {
                // Optionally show success feedback
            } else {
                console.error('Failed to save settings:', res.error)
                alert('Failed to save settings. Please try again.')
            }
        } catch (error) {
            console.error('Error saving settings:', error)
            alert('An error occurred while saving settings.')
        }
    }

    const handleValidateLicense = async () => {
        setIsValidating(true)
        try {
            const res = await window.electron.validateLicense(licenseKey)
            if (res.success && res.data) {
                alert('License validated successfully!')
            } else {
                alert('Invalid license key')
            }
        } finally {
            setIsValidating(false)
        }
    }

    if (!settings) return <div>Loading...</div>

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Header */}
            <nav className="flex items-center justify-between">
                <button
                    onClick={() => setActivePage('home')}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Dashboard
                </button>
                <h1 className="font-bold text-xl text-slate-900 dark:text-white">Settings</h1>
                <div className="w-8" />
            </nav>

            {/* Automation Mode */}
            <Section title="Automation">
                <div className="glass p-6 rounded-2xl space-y-6">
                    <ToggleRow
                        title="Draft Mode (Semi-Auto)"
                        description="Approvals required before sending. Safer for new users."
                        checked={settings.draftMode}
                        onChange={(v) => handleToggle('draftMode', v)}
                    />

                    <div className={`flex items-center justify-between ${settings.draftMode ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div>
                            <h3 className="font-medium text-slate-900 dark:text-white">Fully Autonomous</h3>
                            <p className="text-xs text-slate-500">Bot replies instantly without oversight.</p>
                        </div>
                        <div className="text-xs font-bold text-slate-400">{settings.draftMode ? 'OFF' : 'ON'}</div>
                    </div>
                </div>
            </Section>

            {/* Filters */}
            <Section title="Targeting & Filters">
                <div className="glass p-6 rounded-2xl space-y-6">
                    <ToggleRow
                        title="Ignore Groups"
                        description="Do not reply to group chats automatically."
                        checked={settings.ignoreGroups}
                        onChange={(v) => handleToggle('ignoreGroups', v)}
                    />

                    <ToggleRow
                        title="Ignore Statuses"
                        description="Do not reply to status updates (broadcasts)."
                        checked={settings.ignoreStatuses}
                        onChange={(v) => handleToggle('ignoreStatuses', v)}
                    />

                    <ToggleRow
                        title="Unsaved Contacts Only"
                        description="Only reply to new numbers (ignore saved friends/family)."
                        checked={settings.unsavedContactsOnly}
                        onChange={(v) => handleToggle('unsavedContactsOnly', v)}
                    />
                </div>
            </Section>

            {/* System */}
            <Section title="System">
                <div className="glass p-6 rounded-2xl space-y-6">
                    {/* License Key */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">License Key</label>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                value={licenseKey}
                                onChange={(e) => setLicenseKey(e.target.value)}
                                placeholder="XXXX-XXXX-XXXX-XXXX"
                                className="flex-1 bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                            />
                            <button
                                onClick={handleValidateLicense}
                                disabled={isValidating}
                                className="px-4 py-2 bg-slate-200 dark:bg-surface-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                            >
                                {isValidating ? 'Verifying...' : 'Verify'}
                            </button>
                        </div>
                    </div>

                    {/* System Prompt */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            System Prompt (Persona)
                        </label>
                        <textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            className="w-full h-32 bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg p-4 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none font-mono text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                        />
                        <p className="text-xs text-slate-500">This instruction guides the AI's personality and behavior.</p>
                    </div>
                </div>
            </Section>

            {/* Save Actions */}
            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-3 rounded-xl font-medium shadow-lg shadow-brand-500/20 active:scale-95 transition-all"
                >
                    Save Changes
                </button>
            </div>
        </div>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-4">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</h2>
            {children}
        </section>
    )
}

function ToggleRow({
    title,
    description,
    checked,
    onChange
}: {
    title: string
    description: string
    checked: boolean
    onChange: (value: boolean) => void
}) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h3 className="font-medium text-slate-900 dark:text-white">{title}</h3>
                <p className="text-xs text-slate-500">{description}</p>
            </div>
            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className={`toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all ${checked ? 'right-0 border-brand-500' : 'right-6 border-slate-300 dark:border-slate-600'
                        }`}
                />
                <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${checked ? 'bg-brand-500' : 'bg-slate-300 dark:bg-surface-800'
                    }`} />
            </div>
        </div>
    )
}
