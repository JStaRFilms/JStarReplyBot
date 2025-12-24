import { z } from 'zod'

// ============ Settings ============
export const SettingsSchema = z.object({
    draftMode: z.boolean().default(true),
    ignoreGroups: z.boolean().default(true),
    ignoreStatuses: z.boolean().default(true),
    unsavedContactsOnly: z.boolean().default(false),
    humanHandoverEnabled: z.boolean().default(true),
    safeModeEnabled: z.boolean().default(true),
    minDelay: z.number().min(3).max(30).default(5),
    maxDelay: z.number().min(5).max(60).default(15),
    systemPrompt: z.string().default(
        'You are JStar, a helpful support assistant for [Business Name]. Be polite, concise, and professional. Use emojis sparingly.'
    ),
    licenseKey: z.string().optional(),
    blacklist: z.array(z.string()).default([]),
    whitelist: z.array(z.string()).default([]),
    businessProfile: z.object({
        name: z.string().default(''),
        industry: z.string().default(''),
        targetAudience: z.string().default(''),
        tone: z.enum(['professional', 'friendly', 'enthusiastic', 'formal']).default('professional'),
        description: z.string().default('')
    }).default({}),
    botName: z.string().default('JStar'),
    currency: z.string().default('₦'),
    licenseStatus: z.enum(['active', 'expired', 'invalid', 'trial']).default('trial'),
    licensePlan: z.string().default('free')
})
export type Settings = z.infer<typeof SettingsSchema>

// ============ Draft Message ============
export interface DraftMessage {
    id: string
    chatId: string
    contactName: string
    contactNumber: string
    originalMessageId: string
    query: string
    proposedReply: string
    sentiment: 'low' | 'medium' | 'high'
    createdAt: number
}

// ============ Product Catalog ============
export interface CatalogItem {
    id: string
    name: string
    description: string
    price: number
    imageUrl?: string
    inStock: boolean
    tags: string[]
    createdAt: number
    updatedAt: number
}

// ============ Log Entry ============
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'AI'
export interface LogEntry {
    timestamp: number
    level: LogLevel
    message: string
}

// ============ Document (Knowledge Base) ============
export interface KnowledgeDocument {
    id: string
    name: string
    type: 'pdf' | 'txt' | 'md'
    sizeBytes: number
    vectorCount: number
    indexedAt: number
    filePath?: string // For reindexing support
}

// ============ Stats ============
export interface Stats {
    messagesSent: number
    timeSavedMinutes: number
    leadsCaptured: number
}

// ============ Connection Status ============
export type ConnectionStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'connected' | 'error'

// ============ IPC Channels ============
export const IPC_CHANNELS = {
    // Bot control
    START_BOT: 'bot:start',
    STOP_BOT: 'bot:stop',
    GET_STATUS: 'bot:status',

    // QR Auth
    GET_QR: 'auth:get-qr',
    ON_QR: 'auth:on-qr',
    ON_READY: 'auth:on-ready',
    ON_DISCONNECTED: 'auth:on-disconnected',

    // Settings
    GET_SETTINGS: 'settings:get',
    SAVE_SETTINGS: 'settings:save',

    // Knowledge Base
    UPLOAD_DOCUMENT: 'kb:upload',
    DELETE_DOCUMENT: 'kb:delete',
    GET_DOCUMENTS: 'kb:get-all',
    REINDEX_DOCUMENT: 'kb:reindex',

    // Drafts
    GET_DRAFTS: 'drafts:get-all',
    SEND_DRAFT: 'drafts:send',
    DISCARD_DRAFT: 'drafts:discard',
    EDIT_DRAFT: 'drafts:edit',
    ON_NEW_DRAFT: 'drafts:on-new',

    // License
    VALIDATE_LICENSE: 'license:validate',
    GET_LICENSE_STATUS: 'license:status',

    // Logs
    ON_LOG: 'logs:on-log',
    GET_LOGS: 'logs:get-all',
    EXPORT_LOGS: 'logs:export',

    // Stats
    GET_STATS: 'stats:get',
    ON_STATS_UPDATE: 'stats:on-update',

    // Activity
    ON_ACTIVITY: 'activity:on-new',

    // Catalog
    GET_CATALOG: 'catalog:get-all',
    ADD_PRODUCT: 'catalog:add',
    UPDATE_PRODUCT: 'catalog:update',
    DELETE_PRODUCT: 'catalog:delete',

    // System
    SEED_DB: 'system:seed-db',

    // Smart Queue
    ON_QUEUE_UPDATE: 'queue:on-update', // Active buffers list changed
    ON_QUEUE_PROCESSED: 'queue:on-processed' // A batch was successfully aggregated
} as const

// ============ Queue Types ============
export interface QueueBufferItem {
    contactId: string
    contactName?: string
    messageCount: number
    startTime: number
    expiresAt: number
    lastMessagePreview: string
}

export interface QueueProcessedEvent {
    contactId: string
    contactName?: string
    messageCount: number
    aggregatedPrompt: string
    costSaved: number
    timestamp: number
    status: 'sent' | 'failed' | 'skipped' | 'drafted'
    error?: string
}

// ============ IPC Payloads ============
export interface IPCResponse<T = unknown> {
    success: boolean
    data?: T
    error?: string
}
