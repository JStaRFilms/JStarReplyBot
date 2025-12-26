import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { StyleMemoryPanel } from '../components/settings/StyleMemoryPanel'
import { PersonalNotesPanel } from '../components/settings/PersonalNotesPanel'
import { ContactCategoriesPanel } from '../components/settings/ContactCategoriesPanel'
import { ContactManagementPanel } from '../components/settings/ContactManagementPanel'
import { MoodDetectionPanel } from '../components/settings/MoodDetectionPanel'
import { PersonalAnalyticsPanel } from '../components/settings/PersonalAnalyticsPanel'
import { useAppStore, useSettingsStore } from '../store'
import { useState, useEffect } from 'react'
import type { Settings } from '../../../shared/types'
import { FEATURE_DEFAULTS, isFeatureEnabled } from '../../../shared/config/features'

export default function SettingsPage() {
    const { setActivePage } = useAppStore()
    const { settings, updateSettings } = useSettingsStore()
    const [licenseKey, setLicenseKey] = useState(settings?.licenseKey || '')
    const [isValidating, setIsValidating] = useState(false)
    const [systemPrompt, setSystemPrompt] = useState(settings?.systemPrompt || '')
    const [contacts, setContacts] = useState([])

    // Business Edition Features
    const [businessProfile, setBusinessProfile] = useState(settings?.businessProfile || {
        name: '',
        industry: '',
        targetAudience: '',
        tone: 'professional' as const,
        description: ''
    })
    const [botName, setBotName] = useState(settings?.botName || 'JStar')
    const [currency, setCurrency] = useState(settings?.currency || '₦')

    // Personal Edition Features
    const [personalNotes, setPersonalNotes] = useState(settings?.personalNotes || [])
    const [contactCategories, setContactCategories] = useState(settings?.contactCategories || [])
    const [moodDetection, setMoodDetection] = useState(settings?.moodDetection || {
        enabled: true,
        sensitivity: 'medium' as const,
        autoRespond: false
    })
    const [personalAnalytics, setPersonalAnalytics] = useState(settings?.personalAnalytics || {
        enabled: true,
        showDailyStats: true,
        showWeeklyStats: true,
        showMonthlyStats: true
    })

    const [whitelist, setWhitelist] = useState<string[]>(settings?.whitelist || [])
    const [blacklist, setBlacklist] = useState<string[]>(settings?.blacklist || [])
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

    useEffect(() => {
        loadContacts()
    }, [])

    const loadContacts = async () => {
        try {
            const result = await window.electron.ipcRenderer.invoke('contacts:get-all')
            if (result.success) {
                setContacts(result.data || [])
            }
        } catch (error) {
            console.error('Failed to load contacts:', error)
        }
    }

    const handleToggle = async (key: keyof Settings, value: boolean) => {
        if (!settings) return
        updateSettings({ [key]: value })
        await window.electron.saveSettings({ [key]: value })
    }

    const handleSave = async () => {
        setSaveStatus('idle')
        const newSettings = {
            systemPrompt,
            licenseKey,
            businessProfile,
            botName,
            currency,
            whitelist,
            blacklist,
            personalNotes,
            contactCategories,
            moodDetection,
            personalAnalytics
        }

        try {
            const res = await window.electron.saveSettings(newSettings)
            if (res.success) {
                // IMPORTANT: Update local store to prevent reversion on reload/navigation
                updateSettings(newSettings)
                setSaveStatus('success')
                setTimeout(() => setSaveStatus('idle'), 3000)
            } else {
                console.error('Failed to save settings:', res.error)
                setSaveStatus('error')
            }
        } catch (error) {
            console.error('Error saving settings:', error)
            setSaveStatus('error')
        }
    }

    const handleValidateLicense = async () => {
        setIsValidating(true)
        try {
            const res = await window.electron.validateLicense(licenseKey)
            if (res.success && res.data) {
                // Refresh settings to get the updated status/plan
                const settingsRes = await window.electron.getSettings()
                if (settingsRes.success && settingsRes.data) {
                    updateSettings(settingsRes.data)
                }
                setSaveStatus('success') // Re-use the success indicator
                setTimeout(() => setSaveStatus('idle'), 3000)
            } else {
                alert('Invalid license key')
            }
        } catch (error) {
            console.error('License validation failed:', error)
            alert('Failed to validate license')
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

            {/* App Edition (Personal vs Business) */}
            {(FEATURE_DEFAULTS[settings.edition || 'personal'].canSwitchEdition || (import.meta as any).env?.DEV) && (
                <Section title="App Edition">
                    <div className="glass p-6 rounded-2xl flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-slate-900 dark:text-white">Current Edition</h3>
                            <p className="text-xs text-slate-500">
                                Switch between feature sets. 'Business' mode locks this setting (simulated).
                            </p>
                        </div>
                        <div className="flex bg-slate-100 dark:bg-stone-950 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5 w-full max-w-sm">
                            {(['personal', 'business', 'dev'] as const).map((edition) => (
                                <button
                                    key={edition}
                                    onClick={async () => {
                                        if (!settings) return
                                        updateSettings({ edition })
                                        await window.electron.saveSettings({ edition })
                                    }}
                                    className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 uppercase tracking-wider ${settings.edition === edition
                                        ? 'bg-white dark:bg-surface-800 text-brand-600 dark:text-brand-400 shadow-xl shadow-black/20 ring-1 ring-black/5'
                                        : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-black/5'
                                        }`}
                                >
                                    {edition}
                                </button>
                            ))}
                        </div>
                    </div>
                </Section>
            )}

            {/* Contact Management - Personal Edition Only */}
            {isFeatureEnabled(settings.edition || 'personal', 'contactManagement') && (
                <Section title="Contact Management">
                    <ContactManagementPanel />
                </Section>
            )}

            {/* Business Profile - Business Edition Only */}
            {isFeatureEnabled(settings.edition || 'personal', 'businessProfile') && (
                <Section title="Business Profile">
                    <div className="glass p-6 rounded-2xl space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Business Name</label>
                                <input
                                    type="text"
                                    value={businessProfile.name}
                                    onChange={e => setBusinessProfile(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="JStar Films"
                                    className="w-full bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Industry</label>
                                <input
                                    type="text"
                                    value={businessProfile.industry}
                                    onChange={e => setBusinessProfile(prev => ({ ...prev, industry: e.target.value }))}
                                    placeholder="Photography & Videography"
                                    className="w-full bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Target Audience</label>
                            <input
                                type="text"
                                value={businessProfile.targetAudience}
                                onChange={e => setBusinessProfile(prev => ({ ...prev, targetAudience: e.target.value }))}
                                placeholder="Couples getting married, Corporate clients..."
                                className="w-full bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Brand Tone</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {['professional', 'friendly', 'enthusiastic', 'formal'].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setBusinessProfile(prev => ({ ...prev, tone: t as any }))}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium capitalize border transition-all ${businessProfile.tone === t
                                            ? 'bg-brand-500/10 border-brand-500 text-brand-600'
                                            : 'bg-slate-50 dark:bg-surface-800 border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Business Description</label>
                            <textarea
                                value={businessProfile.description}
                                onChange={e => setBusinessProfile(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="We specialize in cinematic wedding films and high-end corporate video production..."
                                className="w-full h-24 bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg p-4 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none text-slate-600 dark:text-slate-400"
                            />
                        </div>
                    </div>
                </Section>
            )}

            {/* Personal Edition Features */}
            {isFeatureEnabled(settings.edition || 'personal', 'personalNotes') && (
                <Section title="Personal Notes">
                    <PersonalNotesPanel
                        notes={personalNotes}
                        categories={contactCategories}
                        contacts={contacts}
                        onAddNote={(note) => setPersonalNotes(prev => [...prev, { ...note, id: Date.now().toString() }])}
                        onUpdateNote={(id, updates) => setPersonalNotes(prev =>
                            prev.map(note => note.id === id ? { ...note, ...updates } : note)
                        )}
                        onDeleteNote={(id) => setPersonalNotes(prev => prev.filter(note => note.id !== id))}
                    />
                </Section>
            )}

            {/* Contact Categories */}
            {isFeatureEnabled(settings.edition || 'personal', 'contactCategories') && (
                <Section title="Contact Categories">
                    <ContactCategoriesPanel
                        categories={contactCategories}
                        onAddCategory={(category) => setContactCategories(prev => [...prev, { ...category, id: Date.now().toString() }])}
                        onUpdateCategory={(id, updates) => setContactCategories(prev =>
                            prev.map(category => category.id === id ? { ...category, ...updates } : category)
                        )}
                        onDeleteCategory={(id) => setContactCategories(prev => prev.filter(category => category.id !== id))}
                    />
                </Section>
            )}

            {/* Mood Detection */}
            {isFeatureEnabled(settings.edition || 'personal', 'moodDetection') && (
                <Section title="Mood Detection">
                    <MoodDetectionPanel
                        moodDetection={moodDetection}
                        onToggleEnabled={(enabled) => setMoodDetection(prev => ({ ...prev, enabled }))}
                        onSetSensitivity={(sensitivity) => setMoodDetection(prev => ({ ...prev, sensitivity }))}
                        onToggleAutoRespond={(autoRespond) => setMoodDetection(prev => ({ ...prev, autoRespond }))}
                    />
                </Section>
            )}

            {/* Personal Analytics */}
            {isFeatureEnabled(settings.edition || 'personal', 'personalAnalytics') && (
                <Section title="Personal Analytics">
                    <PersonalAnalyticsPanel
                        analytics={personalAnalytics}
                        onToggleEnabled={(enabled) => setPersonalAnalytics(prev => ({ ...prev, enabled }))}
                        onToggleDaily={(show) => setPersonalAnalytics(prev => ({ ...prev, showDailyStats: show }))}
                        onToggleWeekly={(show) => setPersonalAnalytics(prev => ({ ...prev, showWeeklyStats: show }))}
                        onToggleMonthly={(show) => setPersonalAnalytics(prev => ({ ...prev, showMonthlyStats: show }))}
                    />
                </Section>
            )}

            {/* Style Learning & Memory */}
            {(FEATURE_DEFAULTS[settings.edition || 'personal'].styleLearning || FEATURE_DEFAULTS[settings.edition || 'personal'].memory.enabled) && (
                <Section title="Style Learning & Memory">
                    <div className="glass p-6 rounded-2xl">
                        <StyleMemoryPanel />
                    </div>
                </Section>
            )}

            {/* Bot Identity */}
            <Section title="Bot Identity">
                <div className="glass p-6 rounded-2xl space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Bot Name</label>
                            <input
                                type="text"
                                value={botName}
                                onChange={e => setBotName(e.target.value)}
                                placeholder="JStar"
                                className="w-full bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                            />
                            <p className="text-xs text-slate-500">The name the AI will use to introduce itself.</p>
                        </div>

                        {/* Currency Symbol - Business Edition Only */}
                        {isFeatureEnabled(settings.edition || 'personal', 'currencySettings') && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Currency Symbol</label>
                                <input
                                    type="text"
                                    value={currency}
                                    onChange={e => setCurrency(e.target.value)}
                                    placeholder="₦"
                                    className="w-full bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                />
                                <p className="text-xs text-slate-500">Used for product prices (e.g. $, ₦, £).</p>
                            </div>
                        )}
                    </div>
                </div>
            </Section>

            {/* Automation Mode */}
            <Section title="Automation">
                <div className="glass p-6 rounded-2xl space-y-6">
                    <ToggleRow
                        title="Draft Mode (Semi-Auto)"
                        description="Approvals required before sending. Safer for new users."
                        checked={settings.draftMode}
                        onChange={(v) => handleToggle('draftMode', v)}
                    />

                    <ToggleRow
                        title="Safe Mode (Human Mimic)"
                        description="Adds random delays and typing indicators to avoid WhatsApp bans."
                        checked={settings.safeModeEnabled}
                        onChange={(v) => handleToggle('safeModeEnabled', v)}
                    />

                    <ToggleRow
                        title="Voice Note Handling"
                        description="Transcribe and reply to incoming voice notes (Uses Groq/Gemini)."
                        checked={settings.voiceEnabled}
                        onChange={(v) => handleToggle('voiceEnabled', v)}
                    />

                    <ToggleRow
                        title="Multimodal Vision"
                        description="Analyze incoming images using Gemini Vision."
                        checked={settings.visionEnabled}
                        onChange={(v) => handleToggle('visionEnabled', v)}
                    />

                    <ToggleRow
                        title="Allow Human Handover"
                        description="If enabled, bot pauses when user asks for a human."
                        checked={settings.humanHandoverEnabled}
                        onChange={(v) => handleToggle('humanHandoverEnabled', v)}
                    />


                    {FEATURE_DEFAULTS[settings.edition || 'personal'].memory.enabled && (
                        <ToggleRow
                            title="Conversation Memory"
                            description="Remember past conversations per contact (requires restart)."
                            checked={settings.conversationMemory?.enabled !== false}
                            onChange={async (v) => {
                                const newSettings = {
                                    conversationMemory: { ...settings.conversationMemory, enabled: v }
                                }
                                updateSettings(newSettings)
                                await window.electron.saveSettings(newSettings)
                            }}
                        />
                    )}



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

            {/* Access Control */}
            <Section title="Access Control">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StringListEditor
                        title="Whitelist (Always Reply)"
                        description="These numbers will ALWAYS get a reply, ignoring other filters/delays."
                        items={whitelist}
                        setItems={setWhitelist}
                        placeholder="e.g. 2348012345678"
                        color="emerald"
                    />
                    <StringListEditor
                        title="Blacklist (Ignore)"
                        description="These numbers will NEVER get a reply."
                        items={blacklist}
                        setItems={setBlacklist}
                        placeholder="e.g. 2348012345678"
                        color="rose"
                    />
                </div>
            </Section>

            {/* System */}
            <Section title="System">
                <div className="glass p-6 rounded-2xl space-y-6">
                    {/* License Key */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">License Key</label>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${settings.licenseStatus === 'active'
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                }`}>
                                {settings.licenseStatus}
                            </span>
                        </div>
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

                    {/* Persona Management */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Active Persona
                            </label>
                            <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-lg">
                                {/* Simple Persona Switcher for now - purely visual if we don't implement full CRUD yet */}
                                <button className="px-3 py-1 bg-white dark:bg-white/10 shadow-sm rounded text-xs font-semibold text-slate-700 dark:text-white">
                                    Default
                                </button>
                                <button className="px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                                    + New
                                </button>
                            </div>
                        </div>

                        <textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            placeholder="You are a helpful assistant..."
                            className="w-full h-32 bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg p-4 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none font-mono text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                        />
                        <p className="text-xs text-slate-500">
                            Define the AI's personality. {settings.voiceEnabled ? 'This also applies to Voice Note replies.' : ''}
                        </p>
                    </div>
                </div>
            </Section>

            {/* Save Actions */}
            <div className="flex items-center justify-end gap-4 pt-4">
                {saveStatus === 'success' && (
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 animate-fade-in flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Settings Saved!
                    </span>
                )}
                {saveStatus === 'error' && (
                    <span className="text-sm font-medium text-rose-600 dark:text-rose-400 animate-fade-in">
                        Failed to save
                    </span>
                )}
                <button
                    onClick={handleSave}
                    disabled={saveStatus === 'success'}
                    className={`px-8 py-3 rounded-xl font-medium shadow-lg transition-all ${saveStatus === 'success'
                        ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                        : 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-500/20 active:scale-95'
                        }`}
                >
                    {saveStatus === 'success' ? 'Saved' : 'Save Changes'}
                </button>
            </div>

            {/* Developer Zone */}
            <Section title="Developer Zone">
                <div className="glass p-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-rose-900 dark:text-rose-200">Reset & Seed Database</h3>
                            <p className="text-xs text-rose-700/70 dark:text-rose-300/70">Wipes all products and loads "James's Bistro & Motors" sample data.</p>
                        </div>
                        <button
                            onClick={async () => {
                                if (confirm('WARNING: This will delete all your current products and settings. Are you sure?')) {
                                    const res = await window.electron.seedDB()
                                    if (res.success) {
                                        alert('Database seeded successfully! Please restart the app or reload the page.')
                                        window.location.reload()
                                    } else {
                                        alert('Failed to seed database: ' + res.error)
                                    }
                                }
                            }}
                            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-rose-500/20"
                        >
                            Seed Data
                        </button>
                    </div>
                </div>
            </Section>
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

function StringListEditor({
    title,
    description,
    items,
    setItems,
    placeholder,
    color = 'brand'
}: {
    title: string
    description: string
    items: string[]
    setItems: (items: string[]) => void
    placeholder: string
    color?: 'brand' | 'emerald' | 'rose'
}) {
    const [newItem, setNewItem] = useState('')

    const handleAdd = () => {
        if (!newItem.trim()) return
        // Basic normalization: remove spaces, +, etc if needed? 
        // For now, trust the user or just trim. 
        // Backend handles logic, but cleaning here implies better UX.
        const clean = newItem.trim().replace(/[\s+]/g, '')

        if (items.includes(clean)) {
            setNewItem('')
            return
        }

        setItems([...items, clean])
        setNewItem('')
    }

    const handleDelete = (item: string) => {
        setItems(items.filter(i => i !== item))
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleAdd()
        }
    }

    const colorClasses = {
        brand: 'focus:ring-brand-500 text-brand-600',
        emerald: 'focus:ring-emerald-500 text-emerald-600',
        rose: 'focus:ring-rose-500 text-rose-600'
    }

    return (
        <div className="glass p-6 rounded-2xl flex flex-col h-full">
            <div className="mb-4">
                <h3 className="font-medium text-slate-900 dark:text-white">{title}</h3>
                <p className="text-xs text-slate-500">{description}</p>
            </div>

            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={`flex-1 bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none transition-all ${colorClasses[color].split(' ')[0]}`}
                />
                <button
                    onClick={handleAdd}
                    className={`p-2 rounded-lg bg-slate-100 dark:bg-surface-700 hover:bg-slate-200 dark:hover:bg-surface-600 transition-colors ${colorClasses[color].split(' ')[1]}`}
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-48 space-y-2 pr-1 custom-scrollbar">
                {items.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400 italic">
                        No numbers added
                    </div>
                ) : (
                    items.map(item => (
                        <div key={item} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50 dark:bg-surface-800/50 border border-slate-100 dark:border-white/5">
                            <span className="text-sm font-mono text-slate-600 dark:text-slate-300">{item}</span>
                            <button
                                onClick={() => handleDelete(item)}
                                className="text-slate-400 hover:text-rose-500 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
