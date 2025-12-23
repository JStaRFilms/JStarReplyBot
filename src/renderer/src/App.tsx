import { useEffect } from 'react'
import { Home, Link, Brain, Settings, FileText, Sun, Moon } from 'lucide-react'
import { useAppStore, useSettingsStore, useStatsStore, useDraftsStore, useLogsStore, useDocumentsStore, useActivityStore, type ActivityEntry } from './store'
import type { DraftMessage, LogEntry } from '../../shared/types'
import HomePage from './pages/Home'
import ConnectPage from './pages/Connect'
import BrainPage from './pages/Brain'
import SettingsPage from './pages/Settings'
import LogsPage from './pages/Logs'

const navItems = [
    { id: 'home' as const, label: 'Home', icon: Home },
    { id: 'connect' as const, label: 'Connect', icon: Link },
    { id: 'brain' as const, label: 'Brain', icon: Brain },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
    { id: 'logs' as const, label: 'Logs', icon: FileText }
]

export default function App() {
    const { activePage, setActivePage, isDark, toggleTheme, connectionStatus, setConnectionStatus } = useAppStore()
    const { setSettings } = useSettingsStore()
    const { setStats } = useStatsStore()
    const { addDraft, setDrafts } = useDraftsStore()
    const { addLog, setLogs } = useLogsStore()
    const { setDocuments } = useDocumentsStore()
    const { addActivity } = useActivityStore()

    // Initialize data on mount
    useEffect(() => {
        async function init() {
            try {
                // Load settings
                const settingsRes = await window.electron.getSettings()
                if (settingsRes.success && settingsRes.data) {
                    setSettings(settingsRes.data)
                }

                // Load stats
                const statsRes = await window.electron.getStats()
                if (statsRes.success && statsRes.data) {
                    setStats(statsRes.data)
                }

                // Load drafts
                const draftsRes = await window.electron.getDrafts()
                if (draftsRes.success && draftsRes.data) {
                    setDrafts(draftsRes.data)
                }

                // Load logs
                const logsRes = await window.electron.getLogs()
                if (logsRes.success && logsRes.data) {
                    setLogs(logsRes.data)
                }

                // Load documents
                const docsRes = await window.electron.getDocuments()
                if (docsRes.success && docsRes.data) {
                    setDocuments(docsRes.data)
                }

                // Check connection status
                const statusRes = await window.electron.getStatus()
                if (statusRes.success && statusRes.data) {
                    setConnectionStatus(statusRes.data.status as any)
                }
            } catch (error) {
                console.error('Init error:', error)
            }
        }

        init()

        // Set up event listeners
        const unsubQR = window.electron.onQRCode(() => {
            setConnectionStatus('qr_ready')
        })
        const unsubReady = window.electron.onReady(() => {
            setConnectionStatus('connected')
        })
        const unsubDisconnected = window.electron.onDisconnected(() => {
            setConnectionStatus('disconnected')
        })
        const unsubDraft = window.electron.onNewDraft((draft: DraftMessage) => {
            addDraft(draft)
        })
        const unsubLog = window.electron.onLog((entry: LogEntry) => {
            addLog(entry)
        })
        const unsubActivity = window.electron.onActivity((activity: ActivityEntry) => {
            addActivity(activity)
        })

        return () => {
            unsubQR()
            unsubReady()
            unsubDisconnected()
            unsubDraft()
            unsubLog()
            unsubActivity()
        }
    }, [])

    const renderPage = () => {
        switch (activePage) {
            case 'home': return <HomePage />
            case 'connect': return <ConnectPage />
            case 'brain': return <BrainPage />
            case 'settings': return <SettingsPage />
            case 'logs': return <LogsPage />
            default: {
                // Exhaustive check - TypeScript will error if a case is missing
                const _exhaustiveCheck: never = activePage
                return _exhaustiveCheck
            }
        }
    }

    return (
        <div className="min-h-screen p-6 flex flex-col">
            {/* Top Navigation */}
            <nav className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-bold text-white shadow-lg">
                        J
                    </div>
                    <h1 className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                        JStarReplyBot
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* Connection Status */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 glass rounded-full ring-1 ${connectionStatus === 'connected'
                        ? 'ring-emerald-500/20'
                        : connectionStatus === 'qr_ready'
                            ? 'ring-amber-500/20'
                            : 'ring-slate-500/20'
                        }`}>
                        <span className="relative flex h-2.5 w-2.5">
                            {connectionStatus === 'connected' && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            )}
                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${connectionStatus === 'connected'
                                ? 'bg-emerald-500'
                                : connectionStatus === 'qr_ready'
                                    ? 'bg-amber-500'
                                    : 'bg-slate-500'
                                }`} />
                        </span>
                        <span className={`text-xs font-semibold ${connectionStatus === 'connected'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : connectionStatus === 'qr_ready'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}>
                            {connectionStatus === 'connected' ? 'WhatsApp Connected'
                                : connectionStatus === 'qr_ready' ? 'Scan QR Code'
                                    : connectionStatus === 'connecting' ? 'Connecting...'
                                        : 'Disconnected'}
                        </span>
                    </div>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="glass p-2 rounded-full hover:scale-110 transition-transform"
                    >
                        {isDark ? (
                            <Moon className="w-5 h-5 text-slate-300" />
                        ) : (
                            <Sun className="w-5 h-5 text-slate-600" />
                        )}
                    </button>
                </div>
            </nav>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6">
                {navItems.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActivePage(id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activePage === id
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                            : 'glass hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'
                            }`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Page Content */}
            <main className="flex-1">
                {renderPage()}
            </main>
        </div>
    )
}
