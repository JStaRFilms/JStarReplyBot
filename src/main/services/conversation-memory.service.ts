/**
 * Conversation Memory Service
 * 
 * Provides per-contact semantic memory storage using LanceDB.
 * Each contact gets their own isolated table to prevent data leakage.
 */

import { app } from 'electron'
import { join } from 'path'
import { log } from '../logger'

// LanceDB dynamic import (ESM)
let lancedb: typeof import('@lancedb/lancedb') | null = null
let db: Awaited<ReturnType<typeof import('@lancedb/lancedb')['connect']>> | null = null

// Cache of opened tables per contact
const tableCache: Map<string, any> = new Map()

// ============ Types ============

export interface ConversationMemoryRecord {
    id: string
    contactId: string
    role: 'user' | 'assistant'
    text: string
    mediaContext: string | null
    vector: number[]
    timestamp: number
}

export interface RecalledMemory {
    text: string
    role: 'user' | 'assistant'
    mediaContext: string | null
    timestamp: number
    relevance: number
}

// ============ Initialization ============

async function initMemoryDB(): Promise<void> {
    if (db) return

    try {
        lancedb = await import('@lancedb/lancedb')
        const userDataPath = app.getPath('userData')
        const memoryPath = join(userDataPath, 'conversation_memory')

        db = await lancedb.connect(memoryPath)
        log('INFO', 'Conversation Memory DB initialized')
    } catch (error) {
        log('ERROR', `Failed to initialize Conversation Memory DB: ${error}`)
    }
}

/**
 * Get or create a table for a specific contact
 * Table naming: chat_{sanitizedContactId}
 */
async function getContactTable(contactId: string): Promise<any> {
    await initMemoryDB()
    if (!db) throw new Error('Memory DB not initialized')

    // Sanitize contact ID for table name (remove special chars)
    const sanitizedId = contactId.replace(/[^a-zA-Z0-9]/g, '_')
    const tableName = `chat_${sanitizedId}`

    // Check cache first
    if (tableCache.has(tableName)) {
        return tableCache.get(tableName)
    }

    try {
        // Try to open existing table
        const table = await db.openTable(tableName)
        tableCache.set(tableName, table)
        return table
    } catch {
        // Table doesn't exist yet - will be created on first embed
        return null
    }
}

// ============ Embedding Helper ============

async function getEmbedding(text: string): Promise<number[]> {
    // Reuse the existing embedding logic from knowledge-base
    const { getSettings } = await import('../db')
    const settings = await getSettings()

    // Guard against empty text
    if (!text || text.trim().length === 0) {
        log('WARN', 'Skipping embedding for empty text in conversation memory')
        return []
    }

    // 1. Try Gatekeeper (Proxy) if Licensed
    if (settings.licenseStatus === 'active' && settings.licenseKey) {
        try {
            const baseUrl = process.env.GATEKEEPER_URL || 'http://127.0.0.1:3000/api'
            const cleanBase = baseUrl.replace(/\/chat$/, '')
            const GATEKEEPER_EMBED_URL = `${cleanBase}/embed`

            const response = await fetch(GATEKEEPER_EMBED_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.licenseKey}`
                },
                body: JSON.stringify({ value: text })
            })

            if (response.ok) {
                const data = await response.json()
                return data.embedding
            }
            log('WARN', `Gatekeeper embed failed (${response.status}), falling back to local key`)
        } catch (error) {
            log('ERROR', `Gatekeeper embed error: ${error}`)
        }
    }

    // 2. Fallback to Local Gemini Key
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''

    if (!apiKey) {
        log('WARN', 'No Gemini API key for conversation memory embedding')
        return []
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })
    const result = await model.embedContent(text)
    return result.embedding.values
}

// ============ Core Functions ============

/**
 * Embed and store a message in the contact's memory
 */
export async function embedMessage(
    contactId: string,
    role: 'user' | 'assistant',
    content: string,
    mediaContext?: string
): Promise<boolean> {
    try {
        await initMemoryDB()
        if (!db) return false

        // Combine content with media context for richer embedding
        const textToEmbed = mediaContext
            ? `${content}\n[Media: ${mediaContext}]`
            : content

        // Skip if nothing to embed
        if (!textToEmbed.trim()) {
            log('DEBUG', 'Skipping empty message for conversation memory')
            return false
        }

        const vector = await getEmbedding(textToEmbed)
        if (vector.length === 0) {
            log('WARN', 'Failed to generate embedding for conversation memory')
            return false
        }

        const record: ConversationMemoryRecord = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            contactId,
            role,
            text: content,
            mediaContext: mediaContext || null,
            vector,
            timestamp: Date.now()
        }

        // Get or create contact table
        const sanitizedId = contactId.replace(/[^a-zA-Z0-9]/g, '_')
        const tableName = `chat_${sanitizedId}`

        let table = await getContactTable(contactId)

        if (!table && db) {
            // Create new table with first record
            table = await db.createTable(tableName, [record] as unknown as Record<string, unknown>[])
            tableCache.set(tableName, table)
            log('INFO', `Created conversation memory table for ${contactId}`)
        } else if (table) {
            await table.add([record])
        }

        log('DEBUG', `Embedded ${role} message for ${contactId} (${content.substring(0, 30)}...)`)
        return true

    } catch (error) {
        log('ERROR', `Failed to embed message: ${error}`)
        return false
    }
}

/**
 * Semantic search for relevant messages in a contact's memory
 */
export async function recallMemory(
    contactId: string,
    query: string,
    topK: number = 5
): Promise<RecalledMemory[]> {
    try {
        const table = await getContactTable(contactId)
        if (!table) {
            log('DEBUG', `No conversation memory exists for ${contactId}`)
            return []
        }

        const queryVector = await getEmbedding(query)
        if (queryVector.length === 0) {
            return []
        }

        const results = await table
            .vectorSearch(queryVector)
            .limit(topK)
            .toArray()

        return results.map((r: any) => ({
            text: r.text,
            role: r.role,
            mediaContext: r.mediaContext,
            timestamp: r.timestamp,
            relevance: r._distance ? 1 / (1 + r._distance) : 0.5 // Convert distance to similarity
        }))

    } catch (error) {
        log('ERROR', `Failed to recall memory: ${error}`)
        return []
    }
}

/**
 * Get recent messages by timestamp (non-semantic fallback)
 */
export async function getRecentHistory(
    contactId: string,
    limit: number = 10
): Promise<RecalledMemory[]> {
    try {
        const table = await getContactTable(contactId)
        if (!table) {
            return []
        }

        // LanceDB doesn't have ORDER BY, so we fetch more and sort client-side
        const allRecords = await table
            .search()
            .limit(limit * 3) // Fetch extra to account for sorting
            .toArray()

        // Sort by timestamp descending and take limit
        const sorted = allRecords
            .sort((a: any, b: any) => b.timestamp - a.timestamp)
            .slice(0, limit)

        return sorted.map((r: any) => ({
            text: r.text,
            role: r.role,
            mediaContext: r.mediaContext,
            timestamp: r.timestamp,
            relevance: 0 // Not from semantic search
        }))

    } catch (error) {
        log('ERROR', `Failed to get recent history: ${error}`)
        return []
    }
}

/**
 * Prune old messages from a contact's memory
 */
export async function pruneOldMemory(
    contactId: string,
    olderThanDays: number = 30
): Promise<number> {
    try {
        const table = await getContactTable(contactId)
        if (!table) return 0

        const cutoffTimestamp = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000)

        // Delete old records
        await table.delete(`timestamp < ${cutoffTimestamp}`)

        log('INFO', `Pruned old messages for ${contactId} (older than ${olderThanDays} days)`)
        return 1 // LanceDB doesn't return count of deleted rows

    } catch (error) {
        log('ERROR', `Failed to prune memory: ${error}`)
        return 0
    }
}

/**
 * Delete all memory for a contact (GDPR "Forget Me")
 */
export async function deleteContactMemory(contactId: string): Promise<boolean> {
    try {
        await initMemoryDB()
        if (!db) return false

        const sanitizedId = contactId.replace(/[^a-zA-Z0-9]/g, '_')
        const tableName = `chat_${sanitizedId}`

        await db.dropTable(tableName)
        tableCache.delete(tableName)

        log('INFO', `Deleted all conversation memory for ${contactId}`)
        return true

    } catch (error) {
        log('ERROR', `Failed to delete contact memory: ${error}`)
        return false
    }
}

/**
 * Get memory stats for a contact
 */
export async function getMemoryStats(contactId: string): Promise<{ messageCount: number; oldestTimestamp: number | null }> {
    try {
        const table = await getContactTable(contactId)
        if (!table) {
            return { messageCount: 0, oldestTimestamp: null }
        }

        const allRecords = await table.search().limit(1000).toArray()

        if (allRecords.length === 0) {
            return { messageCount: 0, oldestTimestamp: null }
        }

        const oldest = allRecords.reduce((min: any, r: any) =>
            r.timestamp < min.timestamp ? r : min
            , allRecords[0])

        return {
            messageCount: allRecords.length,
            oldestTimestamp: oldest.timestamp
        }

    } catch (error) {
        log('ERROR', `Failed to get memory stats: ${error}`)
        return { messageCount: 0, oldestTimestamp: null }
    }
}
