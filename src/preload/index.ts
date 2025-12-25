import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/types'
import type {
    Settings,
    DraftMessage,
    LogEntry,
    KnowledgeDocument,
    CatalogItem,
    Stats,
    IPCResponse,
    StyleProfile
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

    // Catalog
    getCatalog: (): Promise<IPCResponse<CatalogItem[]>> =>
        ipcRenderer.invoke(IPC_CHANNELS.GET_CATALOG),
    addProduct: (item: CatalogItem): Promise<IPCResponse> =>
        ipcRenderer.invoke(IPC_CHANNELS.ADD_PRODUCT, item),
    updateProduct: (data: { id: string; updates: Partial<CatalogItem> }): Promise<IPCResponse> =>
        ipcRenderer.invoke(IPC_CHANNELS.UPDATE_PRODUCT, data),
    deleteProduct: (id: string): Promise<IPCResponse> =>
        ipcRenderer.invoke(IPC_CHANNELS.DELETE_PRODUCT, id),

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
    },

    // System
    seedDB: (): Promise<IPCResponse> =>
        ipcRenderer.invoke(IPC_CHANNELS.SEED_DB),

    // Smart Queue
    onQueueUpdate: (callback: (items: any[]) => void) => {
        const handler = (_: unknown, items: any[]) => callback(items)
        ipcRenderer.on(IPC_CHANNELS.ON_QUEUE_UPDATE, handler)
        return () => ipcRenderer.removeListener(IPC_CHANNELS.ON_QUEUE_UPDATE, handler)
    },
    onQueueProcessed: (callback: (event: any) => void) => {
        const handler = (_: unknown, event: any) => callback(event)
        ipcRenderer.on(IPC_CHANNELS.ON_QUEUE_PROCESSED, handler)
        return () => ipcRenderer.removeListener(IPC_CHANNELS.ON_QUEUE_PROCESSED, handler)
    },

    // Style Profile
    getStyleProfile: (): Promise<IPCResponse<StyleProfile>> =>
        ipcRenderer.invoke(IPC_CHANNELS.GET_STYLE_PROFILE),
    updateStyleProfile: (updates: Partial<StyleProfile>): Promise<IPCResponse> =>
        ipcRenderer.invoke(IPC_CHANNELS.UPDATE_STYLE_PROFILE, updates),
    deleteStyleItem: (type: 'vocabulary' | 'sample', value: string): Promise<IPCResponse> =>
        ipcRenderer.invoke(IPC_CHANNELS.DELETE_STYLE_ITEM, { type, value }),

    // Conversation Memory
    forgetContact: (contactId: string): Promise<IPCResponse> =>
        ipcRenderer.invoke(IPC_CHANNELS.FORGET_CONTACT, contactId),
    pruneMemory: (contactId: string, days: number): Promise<IPCResponse> =>
        ipcRenderer.invoke(IPC_CHANNELS.PRUNE_MEMORY, { contactId, days }),
    exportMemory: (contactId: string): Promise<IPCResponse> =>
        ipcRenderer.invoke(IPC_CHANNELS.EXPORT_MEMORY, contactId)
}

// Expose to renderer
contextBridge.exposeInMainWorld('electron', electronAPI)

// Type declaration for renderer
export type ElectronAPI = typeof electronAPI
