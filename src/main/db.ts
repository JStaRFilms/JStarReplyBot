import { app } from 'electron'
import { join } from 'path'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import type { Settings, Stats, KnowledgeDocument, DraftMessage } from '../shared/types'
import { SettingsSchema } from '../shared/types'

interface DatabaseSchema {
    settings: Settings
    stats: Stats
    documents: KnowledgeDocument[]
    drafts: DraftMessage[]
    licenseValid: boolean
}

const defaultData: DatabaseSchema = {
    settings: SettingsSchema.parse({}),
    stats: {
        messagesSent: 0,
        timeSavedMinutes: 0,
        leadsCaptured: 0
    },
    documents: [],
    drafts: [],
    licenseValid: false
}

let db: Low<DatabaseSchema> | null = null

export async function initDatabase(): Promise<void> {
    const userDataPath = app.getPath('userData')
    const dbPath = join(userDataPath, 'db.json')

    const adapter = new JSONFile<DatabaseSchema>(dbPath)
    db = new Low(adapter, defaultData)

    await db.read()

    // Ensure defaults exist
    db.data = { ...defaultData, ...db.data }
    await db.write()
}

export function getDb(): Low<DatabaseSchema> {
    if (!db) throw new Error('Database not initialized')
    return db
}

// ============ Settings ============
export async function getSettings(): Promise<Settings> {
    const db = getDb()
    await db.read()
    return db.data.settings
}

export async function saveSettings(settings: Partial<Settings>): Promise<Settings> {
    const db = getDb()
    await db.read()

    // Validate partial settings before merging
    const merged = { ...db.data.settings, ...settings }
    const validated = SettingsSchema.parse(merged)

    db.data.settings = validated
    await db.write()
    return db.data.settings
}

// ============ Stats ============
export async function getStats(): Promise<Stats> {
    const db = getDb()
    await db.read()
    return db.data.stats
}

export async function incrementStats(updates: Partial<Stats>): Promise<Stats> {
    const db = getDb()
    await db.read()

    if (updates.messagesSent) {
        db.data.stats.messagesSent += updates.messagesSent
    }
    if (updates.timeSavedMinutes) {
        db.data.stats.timeSavedMinutes += updates.timeSavedMinutes
    }
    if (updates.leadsCaptured) {
        db.data.stats.leadsCaptured += updates.leadsCaptured
    }

    await db.write()
    return db.data.stats
}

// ============ Documents ============
export async function getDocuments(): Promise<KnowledgeDocument[]> {
    const db = getDb()
    await db.read()
    return db.data.documents
}

export async function addDocument(doc: KnowledgeDocument): Promise<void> {
    const db = getDb()
    await db.read()
    db.data.documents.push(doc)
    await db.write()
}

export async function removeDocument(id: string): Promise<void> {
    const db = getDb()
    await db.read()
    db.data.documents = db.data.documents.filter(d => d.id !== id)
    await db.write()
}

export async function updateDocument(id: string, updates: Partial<KnowledgeDocument>): Promise<void> {
    const db = getDb()
    await db.read()
    const idx = db.data.documents.findIndex(d => d.id === id)
    if (idx !== -1) {
        db.data.documents[idx] = { ...db.data.documents[idx], ...updates } as KnowledgeDocument
        await db.write()
    }
}

// ============ Drafts ============
export async function getDrafts(): Promise<DraftMessage[]> {
    const db = getDb()
    await db.read()
    return db.data.drafts || []
}

export async function addDraft(draft: DraftMessage): Promise<void> {
    const db = getDb()
    await db.read()
    db.data.drafts.push(draft)
    await db.write()
}

export async function removeDraft(id: string): Promise<void> {
    const db = getDb()
    await db.read()
    db.data.drafts = db.data.drafts.filter(d => d.id !== id)
    await db.write()
}

export async function updateDraft(id: string, updates: Partial<DraftMessage>): Promise<void> {
    const db = getDb()
    await db.read()
    const idx = db.data.drafts.findIndex(d => d.id === id)
    if (idx !== -1) {
        db.data.drafts[idx] = { ...db.data.drafts[idx], ...updates } as DraftMessage
        await db.write()
    }
}

// ============ License ============
export async function getLicenseStatus(): Promise<boolean> {
    const db = getDb()
    await db.read()
    return db.data.licenseValid
}

export async function setLicenseStatus(valid: boolean): Promise<void> {
    const db = getDb()
    await db.read()
    db.data.licenseValid = valid
    await db.write()
}

