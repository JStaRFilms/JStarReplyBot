import { ipcMain, dialog } from 'electron'
import { WhatsAppClient } from './whatsapp'
import { getSettings, saveSettings, getStats, getCatalog, addCatalogItem, updateCatalogItem, deleteCatalogItem, seedDatabase } from './db'
import { getLogs, exportLogs } from './logger'
import { indexDocument, deleteDocument, getDocuments, reindexDocument, indexCatalogItem } from './knowledge-base'
import { validateLicenseKey, getLicenseStatus } from './license'
import { styleProfileService } from './services/style-profile.service'
import { moodDetectionService } from './services/mood-detection.service'
import { analyticsService } from './services/analytics.service'
import { personalContextService } from './services/personal-context.service'
import { ContactManagementService } from './services/contact-management.service'
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
            return { success: true }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    // ============ Style Profile ============
    ipcMain.handle(IPC_CHANNELS.GET_STYLE_PROFILE, async () => {
        try {
            const profile = await styleProfileService.getProfile()
            return { success: true, data: profile }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.UPDATE_STYLE_PROFILE, async (_, updates: any) => {
        try {
            if (updates.global) {
                await styleProfileService.updateGlobalStyle(updates.global)
            }
            return { success: true }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.DELETE_STYLE_ITEM, async (_, { type, value }: { type: 'vocabulary' | 'sample'; value: string }) => {
        try {
            if (type === 'vocabulary') {
                await styleProfileService.removeVocabulary(value)
            }
            // Add other deletion types as needed
            return { success: true }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    // ============ Conversation Memory ============
    ipcMain.handle(IPC_CHANNELS.FORGET_CONTACT, async (_, contactId: string): Promise<IPCResponse> => {
        try {
            const { deleteContactMemory } = await import('./services/conversation-memory.service')
            const success = await deleteContactMemory(contactId)
            return { success }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.PRUNE_MEMORY, async (_, { contactId, days }: { contactId: string; days: number }): Promise<IPCResponse> => {
        try {
            const { pruneOldMemory } = await import('./services/conversation-memory.service')
            await pruneOldMemory(contactId, days)
            return { success: true }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.EXPORT_MEMORY, async (_, contactId: string): Promise<IPCResponse> => {
        try {
            const { exportContactMemory } = await import('./services/conversation-memory.service')
            const data = await exportContactMemory(contactId)
            return { success: true, data }
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

    // ============ Personal Edition Features ============

    // Mood Detection
    ipcMain.handle('mood:detect', async (_, message: string, contactId?: string): Promise<IPCResponse> => {
        try {
            const result = await moodDetectionService.detectMood(message, contactId)
            return { success: true, data: result }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle('mood:get-profile', async (_, contactId: string): Promise<IPCResponse> => {
        try {
            const profile = await moodDetectionService.getMoodProfile(contactId)
            return { success: true, data: profile }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    // Analytics
    ipcMain.handle('analytics:get', async (): Promise<IPCResponse> => {
        try {
            const analytics = await analyticsService.getAnalytics()
            return { success: true, data: analytics }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle('analytics:track-message', async (_, messageData: any): Promise<IPCResponse> => {
        try {
            await analyticsService.trackMessage(
                messageData.messageId,
                messageData.direction,
                messageData.contactId,
                messageData.contactName,
                messageData.messageText,
                messageData.wasAutoReplied,
                messageData.replyText
            )
            return { success: true }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle('analytics:export', async (_, format: 'json' | 'csv'): Promise<IPCResponse> => {
        try {
            const data = await analyticsService.exportAnalytics(format)
            return { success: true, data }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle('analytics:clear', async (): Promise<IPCResponse> => {
        try {
            await analyticsService.clearAnalytics()
            return { success: true }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    // Personal Context
    ipcMain.handle('context:get', async (_, contactId: string, contactName?: string, messageText?: string): Promise<IPCResponse> => {
        try {
            const context = await personalContextService.getPersonalContext(contactId, contactName, messageText)
            return { success: true, data: context }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle('context:enrich-prompt', async (_, contactId: string, contactName: string | undefined, messageText: string, basePrompt: string): Promise<IPCResponse> => {
        try {
            const enrichedPrompt = await personalContextService.enrichPrompt(contactId, contactName, messageText, basePrompt)
            return { success: true, data: enrichedPrompt }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle('context:update', async (_, contactId: string, contactName: string | undefined, messageText: string, responseText: string): Promise<IPCResponse> => {
        try {
            await personalContextService.updatePersonalContext(contactId, contactName, messageText, responseText)
            return { success: true }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle('context:clear-cache', async (): Promise<IPCResponse> => {
        try {
            personalContextService.clearCache()
            return { success: true }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    // ============ Contact Management ============

    const contactManagementService = ContactManagementService.getInstance()

    ipcMain.handle(IPC_CHANNELS.GET_CONTACTS, async (): Promise<IPCResponse> => {
        try {
            const contacts = await contactManagementService.getContacts()
            return { success: true, data: contacts }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.ADD_CONTACT, async (_, contactData: any): Promise<IPCResponse> => {
        try {
            const contact = await contactManagementService.addContact(contactData)
            return { success: true, data: contact }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.UPDATE_CONTACT, async (_, { id, updates }: { id: string; updates: any }): Promise<IPCResponse> => {
        try {
            const contact = await contactManagementService.updateContact(id, updates)
            return { success: true, data: contact }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.DELETE_CONTACT, async (_, id: string): Promise<IPCResponse> => {
        try {
            const deleted = await contactManagementService.deleteContact(id)
            return { success: deleted }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.ASSIGN_CONTACT_CATEGORIES, async (_, { contactId, categoryIds }: { contactId: string; categoryIds: string[] }): Promise<IPCResponse> => {
        try {
            const assigned = await contactManagementService.assignCategories(contactId, categoryIds)
            return { success: assigned }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.SEARCH_CONTACTS, async (_, filter: any): Promise<IPCResponse> => {
        try {
            const contacts = await contactManagementService.searchContacts(filter)
            return { success: true, data: contacts }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.IMPORT_CONTACTS, async (_, contacts: any[]): Promise<IPCResponse> => {
        try {
            const result = await contactManagementService.importContacts(contacts)
            return { success: true, data: result }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.EXPORT_CONTACTS, async (): Promise<IPCResponse> => {
        try {
            const contacts = await contactManagementService.exportContacts()
            return { success: true, data: contacts }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    // ============ Contact Notes ============

    ipcMain.handle(IPC_CHANNELS.GET_CONTACT_NOTES, async (): Promise<IPCResponse> => {
        try {
            const notes = await contactManagementService.getContactNotes()
            return { success: true, data: notes }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.ADD_CONTACT_NOTE, async (_, noteData: any): Promise<IPCResponse> => {
        try {
            const note = await contactManagementService.addContactNote(noteData)
            return { success: true, data: note }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.UPDATE_CONTACT_NOTE, async (_, { id, updates }: { id: string; updates: any }): Promise<IPCResponse> => {
        try {
            const note = await contactManagementService.updateContactNote(id, updates)
            return { success: true, data: note }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.DELETE_CONTACT_NOTE, async (_, id: string): Promise<IPCResponse> => {
        try {
            const deleted = await contactManagementService.deleteContactNote(id)
            return { success: deleted }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle(IPC_CHANNELS.GET_CONTACT_NOTES_BY_CONTACT, async (_, contactId: string): Promise<IPCResponse> => {
        try {
            const notes = await contactManagementService.getContactNotesByContact(contactId)
            return { success: true, data: notes }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    // ============ Contact Management - Additional Features ============

    ipcMain.handle('contacts:load-whatsapp', async (): Promise<IPCResponse> => {
        try {
            const result = await contactManagementService.loadWhatsAppContacts()
            return { success: true, data: result }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle('contacts:create-test', async (): Promise<IPCResponse> => {
        try {
            const result = await contactManagementService.createTestContacts()
            return { success: true, data: result }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle('contacts:get-status', async (): Promise<IPCResponse> => {
        try {
            const status = await contactManagementService.getContactSystemStatus()
            return { success: true, data: status }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle('contacts:get-debug-info', async (_, contactId: string): Promise<IPCResponse> => {
        try {
            const debugInfo = await contactManagementService.getContactDebugInfo(contactId)
            return { success: true, data: debugInfo }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle('contacts:clear-all', async (): Promise<IPCResponse> => {
        try {
            const cleared = await contactManagementService.clearAllContacts()
            return { success: cleared }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle('contacts:get-stats', async (): Promise<IPCResponse> => {
        try {
            const stats = await contactManagementService.getContactStats()
            return { success: true, data: stats }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })
}
