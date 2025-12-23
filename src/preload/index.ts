import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/types'
import type {
    Settings,
    DraftMessage,
    LogEntry,
    KnowledgeDocument,
    Stats,
    IPCResponse
} from '../shared/types'

// Exposed API
const electronAPI = {
    // Bot control
    startBot: (): Promise<IPCResponse> =>
        ipcRenderer.invoke(IPC_CHANNELS.START_BOT),
    stopBot: (): Promise<IPCResponse> =>
        ipcRenderer.invoke(IPC_CHANNELS.STOP_BOT),
    getStatus: (): Promise<IPCResponse<{ status: string; isRunning: boolean }>> =>
        ipcRenderer.invoke(IPC_CHANNELS.GET_STATUS),

    // QR Auth
    getQRCode: (): Promise<IPCResponse<string | null>> =>
        ipcRenderer.invoke(IPC_CHANNELS.GET_QR),
    onQRCode: (callback: (qr: string) => void) => {
        const handler = (_: unknown, qr: string) => callback(qr)
        ipcRenderer.on(IPC_CHANNELS.ON_QR, handler)
        return () => ipcRenderer.removeListener(IPC_CHANNELS.ON_QR, handler)
    },
    onReady: (callback: () => void) => {
        const handler = () => callback()
        ipcRenderer.on(IPC_CHANNELS.ON_READY, handler)
        return () => ipcRenderer.removeListener(IPC_CHANNELS.ON_READY, handler)
    },
    onDisconnected: (callback: (reason: string) => void) => {
        const handler = (_: unknown, reason: string) => callback(reason)
        ipcRenderer.on(IPC_CHANNELS.ON_DISCONNECTED, handler)
        return () => ipcRenderer.removeListener(IPC_CHANNELS.ON_DISCONNECTED, handler)
    },

    // Settings
    getSettings: (): Promise<IPCResponse<Settings>> =>
        ipcRenderer.invoke(IPC_CHANNELS.GET_SETTINGS),
    saveSettings: (settings: Partial<Settings>): Promise<IPCResponse<Settings>> =>
        ipcRenderer.invoke(IPC_CHANNELS.SAVE_SETTINGS, settings),

    // Knowledge Base
    uploadDocument: (): Promise<IPCResponse<KnowledgeDocument>> =>
        ipcRenderer.invoke(IPC_CHANNELS.UPLOAD_DOCUMENT),
    deleteDocument: (id: string): Promise<IPCResponse> =>
        ipcRenderer.invoke(IPC_CHANNELS.DELETE_DOCUMENT, id),
    getDocuments: (): Promise<IPCResponse<KnowledgeDocument[]>> =>
        ipcRenderer.invoke(IPC_CHANNELS.GET_DOCUMENTS),
    reindexDocument: (id: string): Promise<IPCResponse> =>
        ipcRenderer.invoke(IPC_CHANNELS.REINDEX_DOCUMENT, id),

    // Drafts
    getDrafts: (): Promise<IPCResponse<DraftMessage[]>> =>
        ipcRenderer.invoke(IPC_CHANNELS.GET_DRAFTS),
    sendDraft: (id: string, editedText?: string): Promise<IPCResponse> =>
        ipcRenderer.invoke(IPC_CHANNELS.SEND_DRAFT, id, editedText),
    discardDraft: (id: string): Promise<IPCResponse> =>
        ipcRenderer.invoke(IPC_CHANNELS.DISCARD_DRAFT, id),
    editDraft: (id: string, newText: string): Promise<IPCResponse> =>
        ipcRenderer.invoke(IPC_CHANNELS.EDIT_DRAFT, id, newText),
    onNewDraft: (callback: (draft: DraftMessage) => void) => {
        const handler = (_: unknown, draft: DraftMessage) => callback(draft)
        ipcRenderer.on(IPC_CHANNELS.ON_NEW_DRAFT, handler)
        return () => ipcRenderer.removeListener(IPC_CHANNELS.ON_NEW_DRAFT, handler)
    },

    // License
    validateLicense: (key: string): Promise<IPCResponse<boolean>> =>
        ipcRenderer.invoke(IPC_CHANNELS.VALIDATE_LICENSE, key),
    getLicenseStatus: (): Promise<IPCResponse<boolean>> =>
        ipcRenderer.invoke(IPC_CHANNELS.GET_LICENSE_STATUS),

    // Logs
    getLogs: (): Promise<IPCResponse<LogEntry[]>> =>
        ipcRenderer.invoke(IPC_CHANNELS.GET_LOGS),
    exportLogs: (): Promise<IPCResponse<string>> =>
        ipcRenderer.invoke(IPC_CHANNELS.EXPORT_LOGS),
    onLog: (callback: (entry: LogEntry) => void) => {
        const handler = (_: unknown, entry: LogEntry) => callback(entry)
        ipcRenderer.on(IPC_CHANNELS.ON_LOG, handler)
        return () => ipcRenderer.removeListener(IPC_CHANNELS.ON_LOG, handler)
    },

    // Stats
    getStats: (): Promise<IPCResponse<Stats>> =>
        ipcRenderer.invoke(IPC_CHANNELS.GET_STATS),
    onStatsUpdate: (callback: (stats: Stats) => void) => {
        const handler = (_: unknown, stats: Stats) => callback(stats)
        ipcRenderer.on(IPC_CHANNELS.ON_STATS_UPDATE, handler)
        return () => ipcRenderer.removeListener(IPC_CHANNELS.ON_STATS_UPDATE, handler)
    },

    // Activity
    onActivity: (callback: (activity: { id: string; contact: string; time: string; query: string; response: string; timestamp: number }) => void) => {
        const handler = (_: unknown, activity: { id: string; contact: string; time: string; query: string; response: string; timestamp: number }) => callback(activity)
        ipcRenderer.on(IPC_CHANNELS.ON_ACTIVITY, handler)
        return () => ipcRenderer.removeListener(IPC_CHANNELS.ON_ACTIVITY, handler)
    }
}

// Expose to renderer
contextBridge.exposeInMainWorld('electron', electronAPI)

// Type declaration for renderer
export type ElectronAPI = typeof electronAPI
