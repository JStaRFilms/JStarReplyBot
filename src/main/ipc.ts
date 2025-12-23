import { ipcMain, dialog } from 'electron'
import { WhatsAppClient } from './whatsapp'
import { getSettings, saveSettings, getStats, getCatalog, addCatalogItem, updateCatalogItem, deleteCatalogItem, seedDatabase } from './db'
import { getLogs, exportLogs } from './logger'
import { indexDocument, deleteDocument, getDocuments, reindexDocument, indexCatalogItem, deleteCatalogItem as deleteCatalogItemVector } from './knowledge-base'
import { validateLicenseKey, getLicenseStatus } from './license'
import { IPC_CHANNELS, SettingsSchema } from '../shared/types'
import type { IPCResponse, Settings, CatalogItem } from '../shared/types'

export function registerIpcHandlers(whatsappClient: WhatsAppClient): void {

    // ============ Bot Control ============

    ipcMain.handle(IPC_CHANNELS.START_BOT, async (): Promise<IPCResponse> => {
        try {
            await whatsappClient.start()
            return { success: true }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.STOP_BOT, async (): Promise<IPCResponse> => {
        try {
            await whatsappClient.stop()
            return { success: true }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.GET_STATUS, (): IPCResponse => {
        return {
            success: true,
            data: {
                status: whatsappClient.getStatus(),
                isRunning: whatsappClient.getStatus() === 'connected'
            }
        }
    })

    // ============ QR Auth ============

    ipcMain.handle(IPC_CHANNELS.GET_QR, (): IPCResponse<string | null> => {
        return { success: true, data: whatsappClient.getQRCode() }
    })

    // ============ Settings ============

    ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, async (): Promise<IPCResponse<Settings>> => {
        try {
            const settings = await getSettings()
            return { success: true, data: settings }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.SAVE_SETTINGS, async (_, settings: Partial<Settings>): Promise<IPCResponse<Settings>> => {
        try {
            // Validate with Zod
            const validated = SettingsSchema.partial().parse(settings)
            const updated = await saveSettings(validated)
            return { success: true, data: updated }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    // ============ Knowledge Base ============

    ipcMain.handle(IPC_CHANNELS.UPLOAD_DOCUMENT, async (): Promise<IPCResponse> => {
        try {
            const result = await dialog.showOpenDialog({
                properties: ['openFile'],
                filters: [
                    { name: 'Documents', extensions: ['pdf', 'txt', 'md'] }
                ]
            })

            if (result.canceled || result.filePaths.length === 0) {
                return { success: false, error: 'No file selected' }
            }

            const filePath = result.filePaths[0]!
            const fileName = filePath.split(/[/\\]/).pop() || 'unknown'
            const ext = fileName.split('.').pop()?.toLowerCase() as 'pdf' | 'txt' | 'md'

            const doc = await indexDocument(filePath, fileName, ext)

            if (doc) {
                return { success: true, data: doc }
            }
            return { success: false, error: 'Failed to index document' }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.DELETE_DOCUMENT, async (_, documentId: string): Promise<IPCResponse> => {
        try {
            const deleted = await deleteDocument(documentId)
            return { success: deleted }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.GET_DOCUMENTS, async (): Promise<IPCResponse> => {
        try {
            const docs = await getDocuments()
            return { success: true, data: docs }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.REINDEX_DOCUMENT, async (_, documentId: string): Promise<IPCResponse> => {
        try {
            const success = await reindexDocument(documentId)
            return { success }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    // ============ Drafts ============

    ipcMain.handle(IPC_CHANNELS.GET_DRAFTS, async (): Promise<IPCResponse> => {
        try {
            const drafts = await whatsappClient.getDrafts()
            return { success: true, data: drafts }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.SEND_DRAFT, async (_, draftId: string, editedText?: string): Promise<IPCResponse> => {
        try {
            const sent = await whatsappClient.sendDraft(draftId, editedText)
            return { success: sent }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.DISCARD_DRAFT, async (_, draftId: string): Promise<IPCResponse> => {
        try {
            const discarded = await whatsappClient.discardDraft(draftId)
            return { success: discarded }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.EDIT_DRAFT, async (_, draftId: string, newText: string): Promise<IPCResponse> => {
        try {
            const edited = await whatsappClient.editDraft(draftId, newText)
            return { success: edited }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    // ============ License ============

    ipcMain.handle(IPC_CHANNELS.VALIDATE_LICENSE, async (_, licenseKey: string): Promise<IPCResponse> => {
        try {
            const valid = await validateLicenseKey(licenseKey)
            return { success: true, data: valid }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.GET_LICENSE_STATUS, async (): Promise<IPCResponse<boolean>> => {
        try {
            const valid = await getLicenseStatus()
            return { success: true, data: valid }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    // ============ Logs ============

    ipcMain.handle(IPC_CHANNELS.GET_LOGS, (): IPCResponse => {
        return { success: true, data: getLogs() }
    })

    ipcMain.handle(IPC_CHANNELS.EXPORT_LOGS, async (): Promise<IPCResponse<string>> => {
        try {
            const result = await dialog.showSaveDialog({
                defaultPath: `jstarreplybot_logs_${Date.now()}.log`,
                filters: [{ name: 'Log Files', extensions: ['log', 'txt'] }]
            })

            if (result.canceled || !result.filePath) {
                return { success: false, error: 'No file selected' }
            }

            const { writeFile } = await import('fs/promises')
            await writeFile(result.filePath, exportLogs())
            return { success: true, data: result.filePath }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    // ============ Stats ============

    // ============ Catalog ============
    console.log('Registering Catalog handlers for:', IPC_CHANNELS.GET_CATALOG, IPC_CHANNELS.ADD_PRODUCT)

    ipcMain.handle(IPC_CHANNELS.GET_CATALOG, async (): Promise<IPCResponse> => {
        try {
            const catalog = await getCatalog()
            return { success: true, data: catalog }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.ADD_PRODUCT, async (_, item: CatalogItem): Promise<IPCResponse> => {
        try {
            await addCatalogItem(item)
            // Async index (don't block UI)
            indexCatalogItem(item).catch(console.error)
            return { success: true }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.UPDATE_PRODUCT, async (_, { id, updates }: { id: string; updates: Partial<CatalogItem> }): Promise<IPCResponse> => {
        try {
            await updateCatalogItem(id, updates)
            // Re-index only if fields affecting search changed
            const shouldReindex = updates.name || updates.description || updates.price || updates.tags
            if (shouldReindex) {
                // Fetch full item to re-index
                const catalog = await getCatalog()
                const newItem = catalog.find(i => i.id === id)
                if (newItem) {
                    indexCatalogItem(newItem).catch(console.error)
                }
            }
            return { success: true }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.DELETE_PRODUCT, async (_, id: string): Promise<IPCResponse> => {
        try {
            await deleteCatalogItem(id)
            await deleteCatalogItemVector(id)
            return { success: true }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    // ============ Stats ============

    ipcMain.handle(IPC_CHANNELS.GET_STATS, async (): Promise<IPCResponse> => {
        try {
            const stats = await getStats()
            return { success: true, data: stats }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    // ============ System ============
    ipcMain.handle(IPC_CHANNELS.SEED_DB, async (): Promise<IPCResponse> => {
        try {
            await seedDatabase()
            return { success: true }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })
}
