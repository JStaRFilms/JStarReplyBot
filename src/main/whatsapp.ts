import { Client, LocalAuth, Message, Contact } from 'whatsapp-web.js'
import { BrowserWindow } from 'electron'
import { app } from 'electron'
import { join } from 'path'
import * as qrcode from 'qrcode'
import { log } from './logger'
import { getSettings, incrementStats, getDrafts as getDbDrafts, addDraft as addDbDraft, removeDraft as removeDbDraft, updateDraft as updateDbDraft } from './db'
import { generateAIReply } from './ai-engine'
import { SmartQueueService } from './services/queue.service'
import type { ConnectionStatus, DraftMessage, Settings } from '../shared/types'
import { IPC_CHANNELS } from '../shared/types'

export class WhatsAppClient {
    private client: Client | null = null
    private status: ConnectionStatus = 'disconnected'
    private qrCodeDataUrl: string | null = null
    private isRunning = false
    private queueService: SmartQueueService

    constructor() {
        this.queueService = new SmartQueueService((channel, data) => this.broadcastToRenderer(channel, data))
        this.initClient()
    }

    private initClient(): void {
        const userDataPath = app.getPath('userData')
        const authPath = join(userDataPath, '.wwebjs_auth')

        this.client = new Client({
            authStrategy: new LocalAuth({ dataPath: authPath }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--disable-gpu'
                ]
            }
        })

        this.setupEventHandlers()
    }

    private setupEventHandlers(): void {
        if (!this.client) return

        this.client.on('qr', async (qr) => {
            log('INFO', 'QR Code received, waiting for scan...')
            this.status = 'qr_ready'
            this.qrCodeDataUrl = await qrcode.toDataURL(qr)
            this.broadcastToRenderer(IPC_CHANNELS.ON_QR, this.qrCodeDataUrl)
        })

        this.client.on('ready', async () => {
            log('INFO', 'WhatsApp client is ready!')
            this.status = 'connected'
            this.qrCodeDataUrl = null
            this.broadcastToRenderer(IPC_CHANNELS.ON_READY, true)

            // FIX: Inject polyfill for missing WhatsApp Web internal function (Store.ContactMethods)
            try {
                // @ts-ignore - Accessing internal puppeteer page
                const page = this.client.pupPage
                if (page) {
                    await page.evaluate(() => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const windowAny = window as any
                        if (!windowAny.Store) windowAny.Store = {}
                        if (!windowAny.Store.ContactMethods) windowAny.Store.ContactMethods = {}

                        if (!windowAny.Store.ContactMethods.getIsMyContact) {
                            windowAny.Store.ContactMethods.getIsMyContact = () => false // Safe fallback
                            console.log('[JStar] Injected getIsMyContact polyfill')
                        }
                    })
                    log('INFO', 'Applied contact lookup patch successfully')
                }
            } catch (patchError) {
                log('WARN', `Failed to apply contact lookup patch: ${patchError}`)
            }
        })

        this.client.on('authenticated', () => {
            log('INFO', 'WhatsApp authenticated successfully')
        })

        this.client.on('auth_failure', (msg) => {
            log('ERROR', `Authentication failed: ${msg}`)
            this.status = 'disconnected'
        })

        this.client.on('disconnected', (reason) => {
            log('WARN', `WhatsApp disconnected: ${reason}`)
            this.status = 'disconnected'
            this.broadcastToRenderer(IPC_CHANNELS.ON_DISCONNECTED, reason)
        })

        this.client.on('message', async (msg) => {
            if (!this.isRunning) return
            await this.handleIncomingMessage(msg)
        })

        this.client.on('message_revoke_everyone', async (msg) => {
            if (!this.isRunning) return
            // Remove the revoked message from the queue if it's currently buffered
            if (msg) {
                this.queueService.removeMessage(msg.from, msg.id._serialized)
            }
        })
    }

    private async handleIncomingMessage(msg: Message): Promise<void> {
        try {
            const settings = await getSettings()

            // Pre-check for simple filters
            if (msg.fromMe) return
            if (settings.ignoreGroups && msg.from.includes('@g.us')) return
            if (settings.ignoreStatuses && msg.from.includes('@broadcast')) return

            // Detailed contact lookup
            let contact
            try {
                contact = await msg.getContact()
            } catch (e) {
                // Known issue: wa-web.js sometimes fails ContactMethods.getIsMyContact check
                log('WARN', `Contact lookup failed: ${e}`)
            }

            // Apply filters (Groups, Statuses, Blacklist, Whitelist, Unsaved Only)
            if (!this.shouldReply(msg, settings, contact)) {
                return
            }

            // Improved Name Resolution
            let contactName = 'Unknown'
            let contactNumber = msg.from.replace('@c.us', '')

            if (contact) {
                contactName = contact.name || contact.pushname || contact.number || contactNumber
                contactNumber = contact.number || contactNumber
            } else {
                // FALLBACK: Try to get pushname from raw message data if getContact failed
                // @ts-ignore - _data exists on the message object at runtime
                const rawName = msg._data?.notifyName || msg._data?.pushname
                contactName = rawName || contactNumber
            }

            // ENQUEUE: Push to Smart Aggregation Queue
            // using msg.from (phone number) as the unique key
            this.queueService.enqueue(msg.from, msg, (messages) =>
                this.processAggregatedMessages(messages, settings, contactName)
            )

        } catch (error) {
            log('ERROR', `Error handling message: ${error}`)
        }
    }

    private async processAggregatedMessages(messages: Message[], settings: Settings, contactName: string): Promise<{ status: 'sent' | 'failed' | 'skipped' | 'drafted'; error?: string }> {
        if (messages.length === 0) return { status: 'skipped' }

        // Use the last message for context (chat ID, timestamp, etc.)
        const lastMsg = messages[messages.length - 1]
        if (!lastMsg) return { status: 'skipped' }
        const contactNumber = lastMsg.from.replace('@c.us', '')

        try {
            let chat
            try {
                chat = await lastMsg.getChat()
            } catch (chatError) {
                log('ERROR', `Failed to get chat context: ${chatError}`)
                return { status: 'failed', error: 'Chat context unavailable' }
            }

            // Combine message bodies with newlines to form a coherent thought
            const combinedQuery = messages.map(m => m.body).join('\n')

            log('INFO', `[SmartQueue] Processing aggregated query (${messages.length} msgs) from ${contactName}: "${combinedQuery.substring(0, 50)}..."`)

            // Fetch conversation history (Last 30 messages)
            let history: { role: 'user' | 'model'; content: string }[] = []
            try {
                const fetchedMessages = await chat.fetchMessages({ limit: 30 })
                // Filter out ALL messages in the current batch from history to avoid duplication
                // We identify them by ID
                const currentBatchIds = new Set(messages.map(m => m.id._serialized))

                history = fetchedMessages
                    .filter(m => !currentBatchIds.has(m.id._serialized))
                    .map(m => ({
                        role: m.fromMe ? 'model' : 'user',
                        content: m.body
                    }))
            } catch (histError) {
                log('WARN', `Failed to fetch history: ${histError}`)
            }

            // Generate AI reply using the COMBINED query
            let reply
            try {
                reply = await generateAIReply(combinedQuery, settings.systemPrompt, history)
            } catch (aiError) {
                const errorStr = String(aiError)
                log('ERROR', `AI Gen Failed: ${errorStr}`)
                return { status: 'failed', error: errorStr.includes('402') ? 'License Expired' : 'AI Service Error' }
            }

            if (!reply) {
                log('WARN', 'No reply generated by AI (Empty response)')
                return { status: 'skipped', error: 'Empty AI Response' }
            }

            // Check for human handover keywords in ANY of the messages
            const handoverRequested = messages.some(m =>
                settings.humanHandoverEnabled && this.detectHandoverRequest(m.body)
            )

            if (handoverRequested) {
                log('INFO', `Human handover requested by ${contactName}`)
                return { status: 'skipped', error: 'Handover Requested' }
            }

            // Draft mode: queue for approval
            if (settings.draftMode) {
                const draft: DraftMessage = {
                    id: `draft_${Date.now()}`,
                    chatId: chat.id._serialized,
                    contactName,
                    contactNumber,
                    originalMessageId: lastMsg.id._serialized, // Link to newest message
                    query: combinedQuery, // Store the FULL aggregated query
                    proposedReply: reply.text,
                    sentiment: reply.sentiment,
                    createdAt: Date.now()
                }

                try {
                    await addDbDraft(draft)
                    this.broadcastToRenderer(IPC_CHANNELS.ON_NEW_DRAFT, draft)
                    log('INFO', `Draft queued for approval: ${draft.id}`)
                    return { status: 'drafted' }
                } catch (dbError) {
                    log('ERROR', `Failed to save draft to database: ${dbError}`)
                    return { status: 'failed', error: 'Draft DB Error' }
                }
            }

            // Auto mode: send with safe mode delays
            try {
                await this.sendReplyWithSafeMode(lastMsg, reply.text, settings)

                // Broadcast activity to renderer
                const now = new Date()
                const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                this.broadcastToRenderer(IPC_CHANNELS.ON_ACTIVITY, {
                    id: `activity_${Date.now()}`,
                    contact: contactName,
                    time: timeStr,
                    query: combinedQuery,
                    response: reply.text,
                    timestamp: Date.now()
                })

                return { status: 'sent' }

            } catch (sendError) {
                log('ERROR', `Failed to send reply: ${sendError}`)
                return { status: 'failed', error: 'WhatsApp Send Failed' }
            }

        } catch (error) {
            log('ERROR', `Error processing aggregated messages: ${error}`)
            return { status: 'failed', error: String(error) }
        }
    }

    private shouldReply(msg: Message, settings: Settings, contact?: Contact): boolean {
        // Ignore own messages
        if (msg.fromMe) return false

        // Ignore groups if setting enabled
        if (settings.ignoreGroups && msg.from.includes('@g.us')) {
            return false
        }

        // Ignore status broadcasts if setting enabled
        if (settings.ignoreStatuses && msg.from.includes('@broadcast')) {
            return false
        }

        // Blacklist check
        if (settings.blacklist.includes(msg.from)) {
            return false
        }

        // Whitelist mode: only reply to whitelisted
        if (settings.whitelist.length > 0 && !settings.whitelist.includes(msg.from)) {
            return false
        }

        // Unsaved Contacts Only check
        if (settings.unsavedContactsOnly) {
            // A contact is "Saved" if isMyContact is true OR they have a name in our phonebook
            const isSaved = contact?.isMyContact || (contact?.name && contact?.name !== contact?.number)
            if (isSaved) {
                log('DEBUG', `Skipping message from saved contact: ${contact?.name || msg.from}`)
                return false
            }
        }

        return true
    }

    private detectHandoverRequest(text: string): boolean {
        const keywords = ['human', 'speak to a person', 'real person', 'agent', 'support', 'help me', 'customer service']
        const lowerText = text.toLowerCase()
        return keywords.some(kw => lowerText.includes(kw))
    }

    private async sendReplyWithSafeMode(msg: Message, text: string, settings: Settings): Promise<void> {
        const chat = await msg.getChat()

        // Split message if needed (FR-017)
        const messages = this.splitMessage(text)

        for (let i = 0; i < messages.length; i++) {
            const messageText = messages[i]
            if (!messageText) continue

            // Safe mode delay (FR-006)
            if (settings.safeModeEnabled) {
                const delay = this.randomDelay(settings.minDelay, settings.maxDelay)
                log('DEBUG', `Safe mode: waiting ${delay}ms before reply ${i + 1}/${messages.length}`)
                await this.sleep(delay)

                // Show typing indicator
                await chat.sendStateTyping()
                await this.sleep(Math.min(messageText.length * 30, 3000)) // Simulate typing
            }

            // Send with quote (FR-016)
            if (i === 0) {
                await msg.reply(messageText)
            } else {
                await chat.sendMessage(messageText)
            }

            log('INFO', `Sent reply ${i + 1}/${messages.length}`)
        }

        // Update stats
        try {
            await incrementStats({
                messagesSent: messages.length,
                timeSavedMinutes: 1 // Assume 1 min saved per reply
            })
        } catch (statsError) {
            log('ERROR', `Failed to update stats: ${statsError}`)
        }
    }

    private splitMessage(text: string): string[] {
        // FR-017: Split long messages into 1-3 bubbles
        // Increased limit to 500 chars to avoid aggressive splitting
        const MAX_BUBBLE_LENGTH = 500

        if (text.length <= MAX_BUBBLE_LENGTH) return [text]

        // Split by sentence terminators followed by whitespace to avoid splitting decimals (e.g. 4.5M)
        const sentences = text.split(/(?<=[.!?])\s+/)
        const messages: string[] = []
        let current = ''

        for (const sentence of sentences) {
            // Add space if appending (reconstructing the split space)
            const nextChunk = current ? `${current} ${sentence}` : sentence

            if (nextChunk.length > MAX_BUBBLE_LENGTH && messages.length < 2) {
                if (current) messages.push(current.trim())
                current = sentence
            } else {
                current = nextChunk
            }
        }

        if (current) messages.push(current.trim())

        return messages.slice(0, 3) // Max 3 bubbles
    }

    private randomDelay(minSec: number, maxSec: number): number {
        return (Math.random() * (maxSec - minSec) + minSec) * 1000
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    private broadcastToRenderer(channel: string, data: unknown): void {
        const windows = BrowserWindow.getAllWindows()
        windows.forEach(win => {
            win.webContents.send(channel, data)
        })
    }

    // ============ Public API ============

    async start(): Promise<void> {
        if (!this.client) {
            this.initClient()
        }

        log('INFO', 'Starting WhatsApp client...')
        log('INFO', 'Launching Chromium browser (this may take 30-60 seconds on first run)...')
        this.status = 'connecting'

        try {
            await this.client?.initialize()
            this.isRunning = true
            log('INFO', 'WhatsApp client initialized successfully')
        } catch (error) {
            log('ERROR', `Failed to initialize WhatsApp client: ${error}`)
            this.status = 'disconnected'
            throw error
        }
    }

    async stop(): Promise<void> {
        log('INFO', 'Stopping WhatsApp client...')
        this.isRunning = false
        await this.client?.destroy()
        this.client = null
        this.status = 'disconnected'
    }

    getStatus(): ConnectionStatus {
        return this.status
    }

    getQRCode(): string | null {
        return this.qrCodeDataUrl
    }

    async getDrafts(): Promise<DraftMessage[]> {
        return await getDbDrafts()
    }

    async sendDraft(draftId: string, editedText?: string): Promise<boolean> {
        // Fetch draft and verify it exists (prevent race condition)
        const drafts = await getDbDrafts()
        const draft = drafts.find(d => d.id === draftId)
        if (!draft || !this.client) return false

        try {
            const text = editedText || draft.proposedReply

            // Note: whatsapp-web.js doesn't provide a reliable way to verify if original message
            // still exists. getChatById can fail if chat was deleted.
            let chat
            try {
                chat = await this.client.getChatById(draft.chatId)
            } catch (chatError) {
                log('WARN', `Chat ${draft.chatId} no longer exists or is inaccessible: ${chatError}`)
                // Remove stale draft since chat is gone
                await removeDbDraft(draftId)
                return false
            }

            await chat.sendMessage(text)

            // Re-verify draft still exists before deletion (atomic check)
            const currentDrafts = await getDbDrafts()
            if (!currentDrafts.find(d => d.id === draftId)) {
                log('WARN', `Draft ${draftId} was already removed by another process`)
            } else {
                await removeDbDraft(draftId)
            }

            try {
                await incrementStats({ messagesSent: 1, timeSavedMinutes: 1 })
            } catch (statsError) {
                log('ERROR', `Failed to update stats: ${statsError}`)
            }

            // Broadcast to Live Feed (as if it was a queue event)
            const event: any = { // using 'any' to avoid circular dep or full type import if not easy
                contactId: draft.contactNumber + '@c.us',
                contactName: draft.contactName,
                messageCount: 1, // approximate
                aggregatedPrompt: draft.query,
                costSaved: 0,
                timestamp: Date.now(),
                status: 'sent',
                error: undefined
            }
            this.broadcastToRenderer(IPC_CHANNELS.ON_QUEUE_PROCESSED, event)

            log('INFO', `Draft ${draftId} sent successfully`)
            return true
        } catch (error) {
            log('ERROR', `Failed to send draft: ${error}`)
            return false
        }
    }

    async discardDraft(draftId: string): Promise<boolean> {
        try {
            // Verify draft exists before removal
            const drafts = await getDbDrafts()
            if (!drafts.find(d => d.id === draftId)) {
                log('WARN', `Draft ${draftId} not found, may have been already removed`)
                return false
            }
            await removeDbDraft(draftId)
            log('INFO', `Draft ${draftId} discarded`)
            return true
        } catch (error) {
            log('ERROR', `Failed to discard draft: ${error}`)
            return false
        }
    }

    async editDraft(draftId: string, newText: string): Promise<boolean> {
        try {
            // Verify draft exists
            const drafts = await getDbDrafts()
            if (!drafts.find(d => d.id === draftId)) {
                log('WARN', `Draft ${draftId} not found for editing`)
                return false
            }
            await updateDbDraft(draftId, { proposedReply: newText })
            return true
        } catch (error) {
            log('ERROR', `Failed to edit draft: ${error}`)
            return false
        }
    }
}
