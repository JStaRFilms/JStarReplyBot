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
    licensePlan: z.string().default('free'),

    // New Features
    voiceEnabled: z.boolean().default(false),
    visionEnabled: z.boolean().default(false),
    personas: z.array(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        systemPrompt: z.string(),
        tone: z.enum(['professional', 'friendly', 'enthusiastic', 'formal', 'custom'])
    })).default([]),
    activePersonaId: z.string().optional(),

    // Conversation Memory (Per-Contact Vector Storage)
    conversationMemory: z.object({
        enabled: z.boolean().default(true),
        maxMessagesPerContact: z.number().default(500),
        ttlDays: z.number().default(30) // 0 = infinite
    }).default({}),

    ownerIntercept: z.object({
        enabled: z.boolean().default(true),
        pauseDurationMs: z.number().default(15000), // Extra pause when owner types (15s)
        doubleTextEnabled: z.boolean().default(true) // Allow bot to follow up after owner
    }).default({}),

    // Application Edition (Personal vs Business)
    edition: z.enum(['personal', 'business', 'dev']).default('personal'),

    // Personal Edition Features
    personalNotes: z.array(z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
        category: z.string().optional(),
        createdAt: z.number(),
        updatedAt: z.number()
    })).default([]),

    contactCategories: z.array(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        color: z.string().default('#3b82f6')
    })).default([]),

    moodDetection: z.object({
        enabled: z.boolean().default(true),
        sensitivity: z.enum(['low', 'medium', 'high']).default('medium'),
        autoRespond: z.boolean().default(false)
    }).default({}),

    personalAnalytics: z.object({
        enabled: z.boolean().default(true),
        showDailyStats: z.boolean().default(true),
        showWeeklyStats: z.boolean().default(true),
        showMonthlyStats: z.boolean().default(true)
    }).default({}),

    // Contact Management System
    contacts: z.array(z.object({
        id: z.string(),
        name: z.string(),
        number: z.string(),
        isSaved: z.boolean().default(false),
        categories: z.array(z.string()).default([]),
        personalNotes: z.array(z.string()).default([]),
        lastContacted: z.number().optional(),
        createdAt: z.number(),
        updatedAt: z.number().optional()
    })).default([]),

    contactNotes: z.array(z.object({
        id: z.string(),
        contactId: z.string(),
        title: z.string(),
        content: z.string(),
        createdAt: z.number(),
        updatedAt: z.number()
    })).default([]),
    lastContactSync: z.number().optional()
})
export type Settings = z.infer<typeof SettingsSchema>

// ============ Contact Management Types ============
export interface Contact {
    id: string
    name: string
    number: string
    isSaved: boolean
    categories: string[]
    personalNotes: string[]
    lastContacted?: number
    createdAt: number
    updatedAt?: number
}

export interface ContactNote {
    id: string
    contactId: string
    title: string
    content: string
    createdAt: number
    updatedAt: number
}

export interface ContactCategory {
    id: string
    name: string
    description?: string
    color: string
}

export interface ContactAssignment {
    contactId: string
    categoryIds: string[]
}

export interface ContactSearchFilter {
    query?: string
    categories?: string[]
    isSaved?: boolean
    sortBy?: 'name' | 'lastContacted' | 'createdAt'
    sortOrder?: 'asc' | 'desc'
}

// ============ Style Profile ============
export type EmojiLevel = 'none' | 'light' | 'moderate' | 'heavy'
export type SentenceStyle = 'short' | 'medium' | 'long'

export interface StylePatterns {
    emojiUsage: EmojiLevel
    sentenceStyle: SentenceStyle
    endsWithPeriod: boolean
}

export interface GlobalStyle {
    vocabulary: string[]
    bannedPhrases: string[]
    patterns: StylePatterns
    sampleMessages: string[]
}

export interface PerChatStyle {
    relationship?: string
    styleOverrides: Partial<GlobalStyle>
    sampleMessages: string[]
}

export interface StyleProfile {
    global: GlobalStyle
    perChat: Record<string, PerChatStyle>
}

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
    isHandover?: boolean
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
    ON_QUEUE_PROCESSED: 'queue:on-processed', // A batch was successfully aggregated

    // Style Profile
    GET_STYLE_PROFILE: 'style:get',
    UPDATE_STYLE_PROFILE: 'style:update',
    DELETE_STYLE_ITEM: 'style:delete-item',

    // Conversation Memory
    FORGET_CONTACT: 'memory:forget-contact',
    PRUNE_MEMORY: 'memory:prune',
    EXPORT_MEMORY: 'memory:export',

    // Contact Management
    GET_CONTACTS: 'contacts:get-all',
    ADD_CONTACT: 'contacts:add',
    UPDATE_CONTACT: 'contacts:update',
    DELETE_CONTACT: 'contacts:delete',
    ASSIGN_CONTACT_CATEGORIES: 'contacts:assign-categories',
    SEARCH_CONTACTS: 'contacts:search',
    IMPORT_CONTACTS: 'contacts:import',
    EXPORT_CONTACTS: 'contacts:export',

    // Contact Notes
    GET_CONTACT_NOTES: 'contact-notes:get-all',
    ADD_CONTACT_NOTE: 'contact-notes:add',
    UPDATE_CONTACT_NOTE: 'contact-notes:update',
    DELETE_CONTACT_NOTE: 'contact-notes:delete',
    GET_CONTACT_NOTES_BY_CONTACT: 'contact-notes:get-by-contact'
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
    reply?: string // The AI's generated reply
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
