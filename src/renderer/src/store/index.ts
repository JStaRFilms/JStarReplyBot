import { create } from 'zustand'
import type { ConnectionStatus, Settings, Stats, DraftMessage, LogEntry, KnowledgeDocument } from '../../../shared/types'

/**
 * RENDERER STORES
 * ---------------
 * These stores are in-memory only in the renderer process.
 * Persistence is handled in the MAIN process via LowDB (src/main/db.ts).
 * 
 * Data flow:
 * 1. On app load, renderer fetches data from main via IPC (window.electron.getSettings, etc.)
 * 2. User changes update local store AND call IPC to persist in main process
 * 3. Main process events (onLog, onDraft, etc.) update renderer stores via IPC listeners
 * 
 * This is the standard Electron architecture - do NOT add persistence middleware here.
 */

// App Store - connection status, theme, active page
interface AppState {
    connectionStatus: ConnectionStatus
    isRunning: boolean
    activePage: 'home' | 'connect' | 'brain' | 'settings' | 'logs' | 'catalog'
    isDark: boolean
    setConnectionStatus: (status: ConnectionStatus) => void
    setIsRunning: (running: boolean) => void
    setActivePage: (page: AppState['activePage']) => void
    toggleTheme: () => void
}

export const useAppStore = create<AppState>((set) => ({
    connectionStatus: 'disconnected',
    isRunning: false,
    activePage: 'home',
    isDark: true,
    setConnectionStatus: (status) => set({ connectionStatus: status }),
    setIsRunning: (running) => set({ isRunning: running }),
    setActivePage: (page) => set({ activePage: page }),
    toggleTheme: () => set((state) => {
        const newDark = !state.isDark
        document.documentElement.classList.toggle('dark', newDark)
        return { isDark: newDark }
    })
}))

// Settings Store
interface SettingsState {
    settings: Settings | null
    isLoading: boolean
    setSettings: (settings: Settings) => void
    updateSettings: (partial: Partial<Settings>) => void
    setLoading: (loading: boolean) => void
}

const defaultSettings: Settings = {
    draftMode: true,
    ignoreGroups: true,
    ignoreStatuses: true,
    unsavedContactsOnly: false,
    humanHandoverEnabled: true,
    safeModeEnabled: true,
    minDelay: 5,
    maxDelay: 15,
    systemPrompt: 'You are JStar, a helpful support assistant. Be polite and concise.',
    blacklist: [],
    whitelist: [],
    businessProfile: {
        name: '',
        industry: '',
        targetAudience: '',
        tone: 'professional',
        description: ''
    },
    botName: 'JStar',
    currency: '₦',
    licenseStatus: 'trial',
    licensePlan: 'free'
}

export const useSettingsStore = create<SettingsState>((set) => ({
    settings: defaultSettings,
    isLoading: false,
    setSettings: (settings) => set({ settings }),
    updateSettings: (partial) => set((state) => ({
        settings: state.settings ? { ...state.settings, ...partial } : null
    })),
    setLoading: (loading) => set({ isLoading: loading })
}))

// Stats Store
interface StatsState {
    stats: Stats
    setStats: (stats: Stats) => void
}

export const useStatsStore = create<StatsState>((set) => ({
    stats: { messagesSent: 0, timeSavedMinutes: 0, leadsCaptured: 0 },
    setStats: (stats) => set({ stats })
}))

// Drafts Store
interface DraftsState {
    drafts: DraftMessage[]
    setDrafts: (drafts: DraftMessage[]) => void
    addDraft: (draft: DraftMessage) => void
    removeDraft: (id: string) => void
    updateDraft: (id: string, text: string) => void
}

export const useDraftsStore = create<DraftsState>((set) => ({
    drafts: [],
    setDrafts: (drafts) => set({ drafts }),
    addDraft: (draft) => set((state) => ({ drafts: [...state.drafts, draft] })),
    removeDraft: (id) => set((state) => ({ drafts: state.drafts.filter(d => d.id !== id) })),
    updateDraft: (id, text) => set((state) => ({
        drafts: state.drafts.map(d => d.id === id ? { ...d, proposedReply: text } : d)
    }))
}))

// Logs Store
interface LogsState {
    logs: LogEntry[]
    addLog: (log: LogEntry) => void
    setLogs: (logs: LogEntry[]) => void
    clearLogs: () => void
}

export const useLogsStore = create<LogsState>((set) => ({
    logs: [],
    addLog: (log) => set((state) => ({ logs: [...state.logs.slice(-999), log] })),
    setLogs: (logs) => set({ logs }),
    clearLogs: () => set({ logs: [] })
}))

// Documents Store
interface DocumentsState {
    documents: KnowledgeDocument[]
    setDocuments: (docs: KnowledgeDocument[]) => void
    addDocument: (doc: KnowledgeDocument) => void
    removeDocument: (id: string) => void
}

export const useDocumentsStore = create<DocumentsState>((set) => ({
    documents: [],
    setDocuments: (documents) => set({ documents }),
    addDocument: (doc) => set((state) => ({ documents: [...state.documents, doc] })),
    removeDocument: (id) => set((state) => ({ documents: state.documents.filter(d => d.id !== id) }))
}))

// Activity Store - for Live Activity feed
export interface ActivityEntry {
    id: string
    contact: string
    time: string
    query: string
    response: string
    timestamp: number
}

interface ActivityState {
    activities: ActivityEntry[]
    addActivity: (activity: ActivityEntry) => void
    setActivities: (activities: ActivityEntry[]) => void
}

export const useActivityStore = create<ActivityState>((set) => ({
    activities: [],
    addActivity: (activity) => set((state) => ({
        activities: [activity, ...state.activities].slice(0, 50) // Keep last 50
    })),
    setActivities: (activities) => set({ activities })
}))

export * from './catalogStore'

