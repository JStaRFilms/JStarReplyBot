import { log } from '../logger'
import { getSettings, saveSettings } from '../db'
import type { Contact, ContactNote, ContactCategory, ContactSearchFilter } from '../../shared/types'

export class ContactManagementService {
    private static instance: ContactManagementService

    private constructor() { }

    public static getInstance(): ContactManagementService {
        if (!ContactManagementService.instance) {
            ContactManagementService.instance = new ContactManagementService()
        }
        return ContactManagementService.instance
    }

    /**
     * Get all contacts
     */
    public async getContacts(): Promise<Contact[]> {
        const settings = await getSettings()
        return settings.contacts || []
    }

    /**
     * Load contacts from WhatsApp Web client
     */
    public async loadWhatsAppContacts(): Promise<{ loaded: number; skipped: number }> {
        try {
            // Import WhatsApp client dynamically to avoid circular dependency
            const { whatsappClient } = await import('../index')

            if (!whatsappClient || whatsappClient.getStatus() !== 'connected') {
                log('WARN', 'WhatsApp client not connected, cannot load contacts')
                return { loaded: 0, skipped: 0 }
            }

            // Get all contacts from WhatsApp
            const waContacts = await whatsappClient?.getContacts() || []
            const settings = await getSettings()
            const existingContacts = settings.contacts || []
            let loaded = 0
            let skipped = 0

            for (const waContact of waContacts) {
                // Skip groups and other non-user contacts
                if (waContact.isGroup || waContact.isWAContact === false) {
                    skipped++
                    continue
                }

                const contactData = {
                    name: waContact.name || waContact.pushname || waContact.number || 'Unknown',
                    number: waContact.number || waContact.id.user,
                    isSaved: waContact.isMyContact || false,
                    categories: [],
                    personalNotes: []
                }

                // Check if contact already exists
                const exists = existingContacts.find(c => c.number === contactData.number)
                if (exists) {
                    skipped++
                    continue
                }

                // Add new contact
                const contact: Contact = {
                    ...contactData,
                    id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    createdAt: Date.now()
                }

                existingContacts.push(contact)
                loaded++
            }

            settings.contacts = existingContacts
            settings.lastContactSync = Date.now()
            await saveSettings(settings)

            log('INFO', `Loaded ${loaded} contacts from WhatsApp, skipped ${skipped}`)
            return { loaded, skipped }
        } catch (error) {
            log('ERROR', `Failed to load WhatsApp contacts: ${error}`)
            return { loaded: 0, skipped: 0 }
        }
    }

    /**
     * Create test contacts for development
     */
    public async createTestContacts(): Promise<{ created: number }> {
        try {
            const settings = await getSettings()
            const existingContacts = settings.contacts || []
            let created = 0

            const testContacts = [
                {
                    name: 'John Doe',
                    number: '+1234567890',
                    isSaved: true,
                    categories: [],
                    personalNotes: ['Regular customer', 'Prefers email communication']
                },
                {
                    name: 'Jane Smith',
                    number: '+1234567891',
                    isSaved: false,
                    categories: [],
                    personalNotes: ['New customer', 'Interested in premium features']
                },
                {
                    name: 'Bob Johnson',
                    number: '+1234567892',
                    isSaved: true,
                    categories: [],
                    personalNotes: ['VIP customer', 'High priority']
                },
                {
                    name: 'Alice Brown',
                    number: '+1234567893',
                    isSaved: false,
                    categories: [],
                    personalNotes: ['Potential lead', 'Follow up needed']
                },
                {
                    name: 'Charlie Wilson',
                    number: '+1234567894',
                    isSaved: true,
                    categories: [],
                    personalNotes: ['Technical support', 'Needs assistance']
                }
            ]

            for (const contactData of testContacts) {
                // Check if contact already exists
                const exists = existingContacts.find(c => c.number === contactData.number)
                if (exists) {
                    continue
                }

                const contact: Contact = {
                    ...contactData,
                    id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    createdAt: Date.now()
                }

                existingContacts.push(contact)
                created++
            }

            settings.contacts = existingContacts
            await saveSettings(settings)

            log('INFO', `Created ${created} test contacts`)
            return { created }
        } catch (error) {
            log('ERROR', `Failed to create test contacts: ${error}`)
            return { created: 0 }
        }
    }

    /**
     * Get contact by ID
     */
    public async getContactById(id: string): Promise<Contact | null> {
        const contacts = await this.getContacts()
        return contacts.find(contact => contact.id === id) || null
    }

    /**
     * Get contact by phone number
     */
    public async getContactByNumber(number: string): Promise<Contact | null> {
        const contacts = await this.getContacts()
        return contacts.find(contact => contact.number === number) || null
    }

    /**
     * Add a new contact
     */
    public async addContact(contactData: Omit<Contact, 'id' | 'createdAt'>): Promise<Contact> {
        const settings = await getSettings()
        const contact: Contact = {
            ...contactData,
            id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: Date.now()
        }

        settings.contacts = [...(settings.contacts || []), contact]
        await saveSettings(settings)

        log('INFO', `Added contact: ${contact.name} (${contact.number})`)
        return contact
    }

    /**
     * Update an existing contact
     */
    public async updateContact(id: string, updates: Partial<Contact>): Promise<Contact | null> {
        const settings = await getSettings()
        const contactIndex = settings.contacts.findIndex(c => c.id === id)

        if (contactIndex === -1) {
            return null
        }

        const currentContact = settings.contacts[contactIndex]
        if (!currentContact) return null

        const updatedContact: Contact = {
            ...currentContact,
            ...updates,
            updatedAt: Date.now()
        }

        settings.contacts[contactIndex] = updatedContact
        await saveSettings(settings)
        log('INFO', `Updated contact: ${updatedContact.name}`)
        return updatedContact
    }

    /**
     * Delete a contact
     */
    public async deleteContact(id: string): Promise<boolean> {
        const settings = await getSettings()
        const contactIndex = settings.contacts.findIndex(c => c.id === id)

        if (contactIndex === -1) {
            return false
        }

        // Remove associated notes
        settings.contactNotes = settings.contactNotes.filter(note => note.contactId !== id)

        // Remove from categories
        settings.contactCategories = settings.contactCategories.map(category => ({
            ...category
        }))

        settings.contacts.splice(contactIndex, 1)
        await saveSettings(settings)

        log('INFO', `Deleted contact: ${id}`)
        return true
    }

    /**
     * Search contacts with filters
     */
    public async searchContacts(filter: ContactSearchFilter): Promise<Contact[]> {
        const contacts = await this.getContacts()

        let filtered = contacts.filter(contact => {
            // Text search
            if (filter.query) {
                const searchLower = filter.query.toLowerCase()
                const matchesText = contact.name.toLowerCase().includes(searchLower) ||
                    contact.number.includes(searchLower)
                if (!matchesText) return false
            }

            // Category filter
            if (filter.categories && filter.categories.length > 0) {
                const hasCategory = contact.categories.some(catId =>
                    filter.categories!.includes(catId)
                )
                if (!hasCategory) return false
            }

            // Saved status filter
            if (filter.isSaved !== undefined) {
                if (contact.isSaved !== filter.isSaved) return false
            }

            return true
        })

        // Sorting
        if (filter.sortBy) {
            filtered.sort((a, b) => {
                let aValue: any, bValue: any

                switch (filter.sortBy) {
                    case 'name':
                        aValue = a.name.toLowerCase()
                        bValue = b.name.toLowerCase()
                        break
                    case 'lastContacted':
                        aValue = a.lastContacted || 0
                        bValue = b.lastContacted || 0
                        break
                    case 'createdAt':
                        aValue = a.createdAt
                        bValue = b.createdAt
                        break
                    default:
                        return 0
                }

                if (aValue < bValue) return filter.sortOrder === 'asc' ? -1 : 1
                if (aValue > bValue) return filter.sortOrder === 'asc' ? 1 : -1
                return 0
            })
        }

        return filtered
    }

    /**
     * Assign categories to a contact
     */
    public async assignCategories(contactId: string, categoryIds: string[]): Promise<boolean> {
        const settings = await getSettings()
        const contactIndex = settings.contacts.findIndex(c => c.id === contactId)

        if (contactIndex === -1) {
            return false
        }

        // Validate categories exist
        const validCategories = settings.contactCategories.filter(cat =>
            categoryIds.includes(cat.id)
        )

        if (validCategories.length !== categoryIds.length) {
            log('WARN', 'Some categories do not exist')
            return false
        }

        const contact = settings.contacts[contactIndex]
        if (!contact) return false

        contact.categories = [...new Set(categoryIds)]
        await saveSettings(settings)

        log('INFO', `Assigned ${categoryIds.length} categories to contact: ${contact.name}`)
        return true
    }

    /**
     * Batch assign categories using comma-separated input
     */
    public async batchAssignCategories(categoryIds: string[], contactNumbers: string[]): Promise<{ success: number; failed: number }> {
        const settings = await getSettings()
        let success = 0
        let failed = 0

        // Validate categories exist
        const validCategories = settings.contactCategories.filter(cat =>
            categoryIds.includes(cat.id)
        )

        if (validCategories.length !== categoryIds.length) {
            log('WARN', 'Some categories do not exist')
            return { success: 0, failed: contactNumbers.length }
        }

        for (const number of contactNumbers) {
            const contact = settings.contacts.find(c => c.number === number)
            if (contact) {
                contact.categories = [...new Set([...contact.categories, ...categoryIds])]
                success++
            } else {
                failed++
            }
        }

        await saveSettings(settings)
        log('INFO', `Batch assigned categories: ${success} success, ${failed} failed`)
        return { success, failed }
    }

    /**
     * Get contacts by category
     */
    public async getContactsByCategory(categoryId: string): Promise<Contact[]> {
        const contacts = await this.getContacts()
        return contacts.filter(contact => contact.categories.includes(categoryId))
    }

    /**
     * Update last contacted timestamp
     */
    public async updateLastContacted(contactId: string): Promise<void> {
        const settings = await getSettings()
        const contact = settings.contacts.find(c => c.id === contactId)

        if (contact) {
            contact.lastContacted = Date.now()
            await saveSettings(settings)
        }
    }

    /**
     * Import contacts from array
     */
    public async importContacts(contacts: Omit<Contact, 'id' | 'createdAt'>[]): Promise<{ imported: number; skipped: number }> {
        const settings = await getSettings()
        let imported = 0
        let skipped = 0

        for (const contactData of contacts) {
            // Check if contact already exists by number
            const existing = settings.contacts.find(c => c.number === contactData.number)
            if (existing) {
                skipped++
                continue
            }

            const contact: Contact = {
                ...contactData,
                id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                createdAt: Date.now()
            }

            settings.contacts.push(contact)
            imported++
        }

        await saveSettings(settings)
        log('INFO', `Imported contacts: ${imported} imported, ${skipped} skipped`)
        return { imported, skipped }
    }

    /**
     * Export contacts to array
     */
    public async exportContacts(): Promise<Contact[]> {
        return await this.getContacts()
    }

    /**
     * Get all contact notes
     */
    public async getContactNotes(): Promise<ContactNote[]> {
        const settings = await getSettings()
        return settings.contactNotes || []
    }

    /**
     * Get contact notes by contact ID
     */
    public async getContactNotesByContact(contactId: string): Promise<ContactNote[]> {
        const notes = await this.getContactNotes()
        return notes.filter(note => note.contactId === contactId)
    }

    /**
     * Add a contact note
     */
    public async addContactNote(noteData: Omit<ContactNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContactNote> {
        const settings = await getSettings()
        const note: ContactNote = {
            ...noteData,
            id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)} `,
            createdAt: Date.now(),
            updatedAt: Date.now()
        }

        settings.contactNotes = [...(settings.contactNotes || []), note]
        await saveSettings(settings)

        log('INFO', `Added note for contact: ${note.contactId} `)
        return note
    }

    /**
     * Update a contact note
     */
    public async updateContactNote(id: string, updates: Partial<ContactNote>): Promise<ContactNote | null> {
        const settings = await getSettings()
        const noteIndex = settings.contactNotes.findIndex(n => n.id === id)

        if (noteIndex === -1) {
            return null
        }

        const currentNote = settings.contactNotes[noteIndex]
        if (!currentNote) return null

        const updatedNote: ContactNote = {
            ...currentNote,
            ...updates,
            updatedAt: Date.now()
        }

        settings.contactNotes[noteIndex] = updatedNote
        await saveSettings(settings)
        log('INFO', `Updated note: ${updatedNote.title} `)
        return updatedNote
    }

    /**
     * Delete a contact note
     */
    public async deleteContactNote(id: string): Promise<boolean> {
        const settings = await getSettings()
        const noteIndex = settings.contactNotes.findIndex(n => n.id === id)

        if (noteIndex === -1) {
            return false
        }

        settings.contactNotes.splice(noteIndex, 1)
        await saveSettings(settings)

        log('INFO', `Deleted note: ${id} `)
        return true
    }

    /**
     * Sync contacts from WhatsApp (called when new messages arrive)
     */
    public async syncContactFromWhatsApp(contactData: {
        id: string
        name: string
        number: string
        isSaved: boolean
    }): Promise<Contact> {
        const existing = await this.getContactByNumber(contactData.number)

        if (existing) {
            // Update existing contact
            return await this.updateContact(existing.id, {
                name: contactData.name,
                isSaved: contactData.isSaved
            }) as Contact
        } else {
            // Create new contact
            return await this.addContact({
                name: contactData.name,
                number: contactData.number,
                isSaved: contactData.isSaved,
                categories: [],
                personalNotes: []
            })
        }
    }

    /**
     * Get contact statistics
     */
    public async getContactStats(): Promise<{
        total: number
        saved: number
        unsaved: number
        byCategory: Record<string, number>
    }> {
        const contacts = await this.getContacts()
        const categories = await this.getContactCategories()

        const stats = {
            total: contacts.length,
            saved: contacts.filter(c => c.isSaved).length,
            unsaved: contacts.filter(c => !c.isSaved).length,
            byCategory: {} as Record<string, number>
        }

        // Count contacts by category
        for (const category of categories) {
            stats.byCategory[category.name] = contacts.filter(c =>
                c.categories.includes(category.id)
            ).length
        }

        return stats
    }

    /**
     * Get all contact categories
     */
    public async getContactCategories(): Promise<ContactCategory[]> {
        const settings = await getSettings()
        return settings.contactCategories || []
    }

    /**
     * Add a new contact category
     */
    public async addContactCategory(categoryData: Omit<ContactCategory, 'id'>): Promise<ContactCategory> {
        const settings = await getSettings()
        const category: ContactCategory = {
            ...categoryData,
            id: `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)} `
        }

        settings.contactCategories = [...(settings.contactCategories || []), category]
        await saveSettings(settings)

        log('INFO', `Added contact category: ${category.name} `)
        return category
    }

    /**
     * Update a contact category
     */
    public async updateContactCategory(id: string, updates: Partial<ContactCategory>): Promise<ContactCategory | null> {
        const settings = await getSettings()
        const categoryIndex = settings.contactCategories.findIndex(c => c.id === id)

        if (categoryIndex === -1) {
            return null
        }

        const currentCategory = settings.contactCategories[categoryIndex]
        if (!currentCategory) return null

        const updatedCategory: ContactCategory = {
            ...currentCategory,
            ...updates
        }

        settings.contactCategories[categoryIndex] = updatedCategory
        await saveSettings(settings)
        log('INFO', `Updated category: ${updatedCategory.name} `)
        return updatedCategory
    }

    /**
     * Delete a contact category
     */
    public async deleteContactCategory(id: string): Promise<boolean> {
        const settings = await getSettings()
        const categoryIndex = settings.contactCategories.findIndex(c => c.id === id)

        if (categoryIndex === -1) {
            return false
        }

        // Remove category from all contacts
        settings.contacts = settings.contacts.map(contact => ({
            ...contact,
            categories: contact.categories.filter(catId => catId !== id)
        }))

        settings.contactCategories.splice(categoryIndex, 1)
        await saveSettings(settings)

        log('INFO', `Deleted category: ${id} `)
        return true
    }

    /**
     * Debug: Get contact system status
     */
    public async getContactSystemStatus(): Promise<{
        totalContacts: number
        totalNotes: number
        totalCategories: number
        lastSyncTime?: number
        hasTestContacts: boolean
        whatsappConnected: boolean
    }> {
        const settings = await getSettings()
        const contacts = settings.contacts || []
        const notes = settings.contactNotes || []
        const categories = settings.contactCategories || []

        // Check if we have test contacts
        const hasTestContacts = contacts.some(c =>
            c.personalNotes.some(note =>
                note.includes('test') || note.includes('Test') ||
                note.includes('regular customer') || note.includes('new customer')
            )
        )

        // Check WhatsApp connection status
        let whatsappConnected = false
        try {
            const { whatsappClient } = await import('../index')
            whatsappConnected = whatsappClient !== null && whatsappClient.getStatus() === 'connected'
        } catch (error) {
            log('DEBUG', 'Could not check WhatsApp connection status')
        }

        return {
            totalContacts: contacts.length,
            totalNotes: notes.length,
            totalCategories: categories.length,
            lastSyncTime: settings.lastContactSync,
            hasTestContacts,
            whatsappConnected
        }
    }

    /**
     * Debug: Get detailed contact information
     */
    public async getContactDebugInfo(contactId: string): Promise<{
        contact: Contact | null
        notes: ContactNote[]
        categories: ContactCategory[]
        aiContext: any
    }> {
        const contact = await this.getContactById(contactId)
        const notes = await this.getContactNotesByContact(contactId)

        const settings = await getSettings()
        const categories = settings.contactCategories || []
        const contactCategories = categories.filter(cat =>
            contact?.categories.includes(cat.id)
        )

        // Try to get AI context if available
        let aiContext = null
        try {
            const { getRecentHistory, recallMemory } = await import('./conversation-memory.service')
            if (contact) {
                const recentHistory = await getRecentHistory(contact.number, 5)
                const semanticMemory = await recallMemory(contact.number, 'debug', 3)
                aiContext = {
                    recentHistory,
                    semanticMemory,
                    hasMemory: recentHistory.length > 0 || semanticMemory.length > 0
                }
            }
        } catch (error) {
            log('DEBUG', 'Could not fetch AI context for contact')
        }

        return {
            contact,
            notes,
            categories: contactCategories,
            aiContext
        }
    }

    /**
     * Clear all contacts (for testing)
     */
    public async clearAllContacts(): Promise<boolean> {
        try {
            const settings = await getSettings()
            settings.contacts = []
            settings.contactNotes = []
            await saveSettings(settings)
            log('INFO', 'Cleared all contacts and notes')
            return true
        } catch (error) {
            log('ERROR', `Failed to clear contacts: ${error}`)
            return false
        }
    }
}