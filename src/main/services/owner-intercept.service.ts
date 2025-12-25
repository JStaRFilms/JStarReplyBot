/**
 * Owner Intercept Service
 * 
 * Tracks when the owner (YOU) sends messages into conversations the bot is managing.
 * Enables "Collaborative Mode" where the bot can pause, learn from your responses,
 * and decide whether to add a follow-up or stay silent.
 */

import { Message } from 'whatsapp-web.js'
import { log } from '../logger'
import { embedMessage } from './conversation-memory.service'

interface OwnerActivity {
    ownerMessage: Message
    ownerMessageText: string
    timestamp: number
    pendingCustomerMessages: Message[]
}

export class OwnerInterceptService {
    // Map of chatId -> owner activity
    private activeChats: Map<string, OwnerActivity> = new Map()

    // How long to remember owner activity before expiring (default: 5 minutes)
    private readonly ACTIVITY_TTL_MS = 5 * 60 * 1000

    constructor() {
        // Periodic cleanup of stale entries
        setInterval(() => this.cleanup(), 60 * 1000)
    }

    /**
     * Called when the owner sends a message to a chat.
     * This signals that the owner is taking over the conversation.
     */
    onOwnerMessage(chatId: string, msg: Message): void {
        const existing = this.activeChats.get(chatId)

        log('INFO', `[OwnerIntercept] Owner messaged ${chatId}: "${msg.body.substring(0, 50)}..."`)

        this.activeChats.set(chatId, {
            ownerMessage: msg,
            ownerMessageText: msg.body,
            timestamp: Date.now(),
            pendingCustomerMessages: existing?.pendingCustomerMessages || []
        })

        // Style Learning: Persist owner message to memory
        // This allows us to learn from how the owner actually replies
        embedMessage(chatId, 'owner', msg.body)
            .catch(err => log('ERROR', `[OwnerIntercept] Failed to embed owner message: ${err}`))
    }

    /**
     * Called when a customer message is queued. We track it here in case
     * the owner responds before the bot does.
     */
    trackCustomerMessage(chatId: string, msg: Message): void {
        const existing = this.activeChats.get(chatId)

        if (existing) {
            existing.pendingCustomerMessages.push(msg)
        } else {
            // No owner activity yet, but track for potential future interception
            this.activeChats.set(chatId, {
                ownerMessage: null as unknown as Message,
                ownerMessageText: '',
                timestamp: Date.now(),
                pendingCustomerMessages: [msg]
            })
        }
    }

    /**
     * Check if the owner has recently messaged this chat.
     * Used before generating an AI reply to decide if we should inject owner context.
     */
    hasOwnerActivity(chatId: string): boolean {
        const activity = this.activeChats.get(chatId)
        if (!activity || !activity.ownerMessageText) return false

        // Check if activity is still fresh (within TTL)
        const age = Date.now() - activity.timestamp
        if (age > this.ACTIVITY_TTL_MS) {
            this.activeChats.delete(chatId)
            return false
        }

        return true
    }

    /**
     * Get the owner's message for context injection into the AI prompt.
     */
    getOwnerContext(chatId: string): { ownerMessage: string; customerMessages: string[] } | null {
        const activity = this.activeChats.get(chatId)
        if (!activity || !activity.ownerMessageText) return null

        return {
            ownerMessage: activity.ownerMessageText,
            customerMessages: activity.pendingCustomerMessages.map(m => m.body)
        }
    }

    /**
     * Clear activity for a chat after the bot has processed it.
     */
    clearChat(chatId: string): void {
        log('DEBUG', `[OwnerIntercept] Clearing activity for ${chatId}`)
        this.activeChats.delete(chatId)
    }

    /**
     * Cleanup stale entries to prevent memory leaks.
     */
    private cleanup(): void {
        const now = Date.now()
        let cleaned = 0

        for (const [chatId, activity] of this.activeChats.entries()) {
            if (now - activity.timestamp > this.ACTIVITY_TTL_MS) {
                this.activeChats.delete(chatId)
                cleaned++
            }
        }

        if (cleaned > 0) {
            log('DEBUG', `[OwnerIntercept] Cleaned up ${cleaned} stale entries`)
        }
    }

    /**
     * Get debug info about active chats.
     */
    getActiveChats(): string[] {
        return Array.from(this.activeChats.keys())
    }
}

// Singleton instance
export const ownerInterceptService = new OwnerInterceptService()
