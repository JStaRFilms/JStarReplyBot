import { Message } from 'whatsapp-web.js'
import { log } from '../logger'
import { QueueBufferItem, QueueProcessedEvent } from '../../shared/types'

type QueueItem = {
    timer: NodeJS.Timeout
    messages: Message[]
    startTime: number
}

type BroadcastFn = (channel: string, data: any) => void

export class SmartQueueService {
    private buffers: Map<string, QueueItem> = new Map()
    // 10 seconds debounce - allows user to type multiple valid messages
    private readonly DEBOUNCE_MS = 10000
    private broadcast?: BroadcastFn

    constructor(broadcast?: BroadcastFn) {
        this.broadcast = broadcast
    }

    public setBroadcast(fn: BroadcastFn) {
        this.broadcast = fn
    }

    /**
     * Enqueue a message for a specific contact.
     * Starts or resets the debounce timer.
     */
    enqueue(
        contactId: string,
        message: Message,
        onProcess: (messages: Message[]) => Promise<{ status: 'sent' | 'failed' | 'skipped' | 'drafted'; error?: string }>
    ): void {
        const existing = this.buffers.get(contactId)
        const now = Date.now()

        // Helper to get contact name (best effort)
        const contactName = (message as any)._data?.notifyName || contactId.replace('@c.us', '')

        if (existing) {
            // Buffer already exists: cancel old timer, add message, restart timer
            clearTimeout(existing.timer)
            existing.messages.push(message)

            log('DEBUG', `[SmartQueue] Buffering message for ${contactName} (${existing.messages.length} pending)`)

            existing.timer = setTimeout(() => {
                this.processBuffer(contactId, onProcess)
            }, this.DEBOUNCE_MS)
        } else {
            // New buffer
            log('DEBUG', `[SmartQueue] Starting new buffer for ${contactName}`)
            const timer = setTimeout(() => {
                this.processBuffer(contactId, onProcess)
            }, this.DEBOUNCE_MS)

            this.buffers.set(contactId, {
                timer,
                messages: [message],
                startTime: now
            })
        }

        this.emitQueueUpdate()
    }

    /**
     * Remove a specific message from the queue (e.g. if it was revoked/deleted)
     */
    public removeMessage(contactId: string, messageId: string): void {
        const item = this.buffers.get(contactId)
        if (!item) return

        const originalCount = item.messages.length
        item.messages = item.messages.filter(m => m.id._serialized !== messageId)

        if (item.messages.length !== originalCount) {
            log('INFO', `[SmartQueue] Removed revoked message ${messageId} from ${contactId} buffer`)

            // If the buffer is now empty, kill the timer and delete the item
            if (item.messages.length === 0) {
                clearTimeout(item.timer)
                this.buffers.delete(contactId)
                log('DEBUG', `[SmartQueue] Empty buffer for ${contactId} removed`)
            }

            this.emitQueueUpdate()
        }
    }

    private async processBuffer(
        contactId: string,
        callback: (messages: Message[]) => Promise<{ status: 'sent' | 'failed' | 'skipped' | 'drafted'; error?: string }>
    ) {
        const item = this.buffers.get(contactId)
        if (!item) return

        this.buffers.delete(contactId) // Remove from map
        this.emitQueueUpdate() // Update UI immediately

        log('INFO', `[SmartQueue] Processing batch of ${item.messages.length} messages for ${contactId}`)

        try {
            const result = await callback(item.messages)

            // Emit processed event with ACTUAL result from callback
            if (this.broadcast) {
                const event: QueueProcessedEvent = {
                    contactId,
                    contactName: (item.messages[0] as any)._data?.notifyName || contactId,
                    messageCount: item.messages.length,
                    aggregatedPrompt: item.messages.map(m => m.body).join(' | '),
                    costSaved: (item.messages.length - 1) * 0.05,
                    timestamp: Date.now(),
                    status: result.status,
                    error: result.error
                }
                this.broadcast('queue:on-processed', event)
            }

        } catch (error) {
            log('ERROR', `[SmartQueue] Failed to process batch: ${error}`)
            // Emit failure event
            if (this.broadcast) {
                const event: QueueProcessedEvent = {
                    contactId,
                    contactName: (item.messages[0] as any)._data?.notifyName || contactId,
                    messageCount: item.messages.length,
                    aggregatedPrompt: item.messages.map(m => m.body).join(' | '),
                    costSaved: 0,
                    timestamp: Date.now(),
                    status: 'failed',
                    error: String(error)
                }
                this.broadcast('queue:on-processed', event)
            }
        }
    }

    private emitQueueUpdate() {
        if (!this.broadcast) return

        const items = Array.from(this.buffers.entries()).map(([id, item]) => {
            const lastMsg = item.messages[item.messages.length - 1]
            if (!lastMsg) return null

            const bufferItem: QueueBufferItem = {
                contactId: id,
                contactName: (lastMsg as any)._data?.notifyName || id.replace('@c.us', ''),
                messageCount: item.messages.length,
                startTime: item.startTime,
                expiresAt: Date.now() + this.DEBOUNCE_MS,
                lastMessagePreview: lastMsg.body.substring(0, 30)
            }
            return bufferItem
        }).filter((i): i is QueueBufferItem => i !== null)

        this.broadcast('queue:on-update', items)
    }
}
