import { log } from '../logger'
import { getSettings } from '../db'
import { Settings } from '../../shared/types'
import { moodDetectionService } from './mood-detection.service'
import { ContactManagementService } from './contact-management.service'

export interface PersonalContext {
    contactId: string
    contactName?: string
    category?: string
    personalNotes: string[]
    contactNotes: string[]
    moodProfile?: {
        dominantEmotion: string
        averageTone: 'positive' | 'negative' | 'neutral'
        lastUpdated: number
    }
    responsePreferences: {
        preferredTone: 'empathetic' | 'professional' | 'enthusiastic' | 'casual' | 'formal'
        responseLength: 'short' | 'medium' | 'long'
        emojiPreference: 'none' | 'light' | 'moderate' | 'heavy'
    }
    conversationHistory: {
        lastMessage: string
        lastResponse: string
        topics: string[]
        sentimentTrend: 'improving' | 'declining' | 'stable'
    }
}

export interface ContextEnrichment {
    personalNotes: string
    contactNotes: string
    contactCategory: string
    moodContext: string
    responseGuidance: string
    conversationMemory: string
}

export class PersonalContextService {
    private static instance: PersonalContextService
    private contextCache: Map<string, PersonalContext> = new Map()
    private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
    private contactManagementService: ContactManagementService

    private constructor() {
        this.contactManagementService = ContactManagementService.getInstance()
    }

    public static getInstance(): PersonalContextService {
        if (!PersonalContextService.instance) {
            PersonalContextService.instance = new PersonalContextService()
        }
        return PersonalContextService.instance
    }

    /**
     * Get enriched personal context for a contact
     */
    public async getPersonalContext(
        contactId: string,
        contactName?: string,
        messageText?: string
    ): Promise<PersonalContext | null> {
        const settings = await getSettings()

        if (!settings.edition || settings.edition === 'business') {
            return null // Personal context only available in Personal edition
        }

        // Check cache first
        const cached = this.contextCache.get(contactId)
        if (cached && Date.now() - cached.conversationHistory.lastMessage.length < this.CACHE_TTL) {
            return cached
        }

        // Build context from settings and contact management
        const contact = await this.contactManagementService.getContactById(contactId)
        const contactNotes = await this.contactManagementService.getContactNotesByContact(contactId)

        const personalContext: PersonalContext = {
            contactId,
            contactName: contactName || contact?.name,
            category: this.getContactCategory(contact),
            personalNotes: this.getPersonalNotes(contactId, settings.personalNotes),
            contactNotes: contactNotes.map(note => `${note.title}: ${note.content}`),
            moodProfile: await this.getMoodProfile(contactId),
            responsePreferences: this.getResponsePreferences(contactId, settings),
            conversationHistory: this.getConversationHistory(contactId, messageText)
        }

        // Cache the result
        this.contextCache.set(contactId, personalContext)

        return personalContext
    }

    /**
     * Enrich AI prompt with personal context
     */
    public async enrichPrompt(
        contactId: string,
        contactName: string | undefined,
        messageText: string,
        basePrompt: string
    ): Promise<string> {
        const context = await this.getPersonalContext(contactId, contactName, messageText)

        if (!context) {
            return basePrompt // No personal context available
        }

        const enrichment = this.buildContextEnrichment(context, messageText)

        const enrichedPrompt = `${basePrompt}

--- PERSONAL CONTEXT ---
${enrichment.personalNotes}
${enrichment.contactNotes}
${enrichment.contactCategory}
${enrichment.moodContext}
${enrichment.responseGuidance}
${enrichment.conversationMemory}
--- END PERSONAL CONTEXT ---

IMPORTANT: Use this personal context to make your response more relevant and personalized. Consider the contact's category, mood, and preferences when crafting your reply.`

        return enrichedPrompt
    }

    /**
     * Update personal context with new interaction
     */
    public async updatePersonalContext(
        contactId: string,
        contactName: string | undefined,
        messageText: string,
        responseText: string
    ): Promise<void> {
        const settings = await getSettings()

        if (!settings.edition || settings.edition === 'business') {
            return
        }

        // Update mood detection
        const moodResult = await moodDetectionService.detectMood(messageText, contactId)
        await moodDetectionService.updateMoodProfile(contactId, moodResult)

        // Update contact last contacted timestamp
        await this.contactManagementService.updateLastContacted(contactId)

        // Update conversation history
        const cached = this.contextCache.get(contactId)
        if (cached) {
            cached.conversationHistory.lastMessage = messageText
            cached.conversationHistory.lastResponse = responseText
            cached.conversationHistory.topics = this.extractTopics(messageText, responseText)
            cached.conversationHistory.sentimentTrend = this.calculateSentimentTrend(cached.conversationHistory)
            cached.moodProfile = {
                dominantEmotion: moodResult.emotion,
                averageTone: moodResult.tone,
                lastUpdated: Date.now()
            }
        }

        log('INFO', `Updated personal context for ${contactName || contactId}`)
    }

    /**
     * Get response tone adjustment based on personal context
     */
    public getResponseToneAdjustment(context: PersonalContext): {
        tone: 'empathetic' | 'professional' | 'enthusiastic' | 'casual' | 'formal'
        adjustments: string[]
    } {
        if (!context) {
            return { tone: 'professional', adjustments: [] }
        }

        const { moodProfile, responsePreferences, category } = context

        // Start with preferred tone
        let tone = responsePreferences.preferredTone
        const adjustments: string[] = []

        // Adjust based on mood
        if (moodProfile) {
            const moodAdjustment = this.getMoodBasedToneAdjustment(moodProfile.dominantEmotion)
            if (moodAdjustment) {
                tone = moodAdjustment
                adjustments.push(`Adjust tone for ${moodProfile.dominantEmotion} mood`)
            }
        }

        // Adjust based on category
        if (category) {
            const categoryAdjustment = this.getCategoryBasedToneAdjustment(category)
            if (categoryAdjustment) {
                adjustments.push(`Consider ${category} relationship context`)
            }
        }

        // Add specific adjustments
        if (responsePreferences.emojiPreference === 'none') {
            adjustments.push('Avoid using emojis')
        } else if (responsePreferences.emojiPreference === 'heavy') {
            adjustments.push('Use emojis liberally')
        }

        if (responsePreferences.responseLength === 'short') {
            adjustments.push('Keep response concise')
        } else if (responsePreferences.responseLength === 'long') {
            adjustments.push('Provide detailed response')
        }

        return { tone, adjustments }
    }

    /**
     * Clear personal context cache
     */
    public clearCache(): void {
        this.contextCache.clear()
        log('INFO', 'Personal context cache cleared')
    }

    private getContactCategory(contact: any): string | undefined {
        if (!contact || !contact.categories || contact.categories.length === 0) {
            return 'General'
        }

        // Return the first category or a combined list
        return contact.categories.join(', ')
    }

    private getPersonalNotes(contactId: string, notes: Settings['personalNotes']): string[] {
        // Filter notes that might be relevant to this contact
        return notes
            .filter(note => note.content.toLowerCase().includes(contactId.toLowerCase()) ||
                note.title.toLowerCase().includes(contactId.toLowerCase()))
            .map(note => note.content)
    }

    private async getMoodProfile(contactId: string): Promise<{
        dominantEmotion: string
        averageTone: 'positive' | 'negative' | 'neutral'
        lastUpdated: number
    } | undefined> {
        try {
            const profile = await moodDetectionService.getMoodProfile(contactId)
            if (profile) {
                return {
                    dominantEmotion: Object.keys(profile.emotions).reduce((a, b) =>
                        (profile.emotions[a] || 0) > (profile.emotions[b] || 0) ? a : b
                    ),
                    averageTone: profile.averageTone,
                    lastUpdated: profile.lastUpdated
                }
            }
        } catch (error) {
            log('WARN', `Failed to get mood profile for ${contactId}: ${error}`)
        }
        return undefined
    }

    private getResponsePreferences(_contactId: string, _settings: Settings): PersonalContext['responsePreferences'] {
        // This would integrate with user preferences
        // For now, return default preferences
        return {
            preferredTone: 'professional',
            responseLength: 'medium',
            emojiPreference: 'moderate'
        }
    }

    private getConversationHistory(_contactId: string, messageText?: string): PersonalContext['conversationHistory'] {
        // This would integrate with conversation memory
        // For now, return mock history
        return {
            lastMessage: messageText || '',
            lastResponse: '',
            topics: messageText ? this.extractTopics(messageText, '') : [],
            sentimentTrend: 'stable'
        }
    }

    private buildContextEnrichment(context: PersonalContext, _messageText: string): ContextEnrichment {
        const personalNotes = context.personalNotes.length > 0
            ? `Personal Notes: ${context.personalNotes.join('; ')}`
            : 'No personal notes available'

        const contactNotes = context.contactNotes.length > 0
            ? `Contact Notes: ${context.contactNotes.join('; ')}`
            : 'No contact notes available'

        const contactCategory = context.category
            ? `Contact Category: ${context.category}`
            : 'Contact Category: General'

        const moodContext = context.moodProfile
            ? `Current Mood: ${context.moodProfile.dominantEmotion} (${context.moodProfile.averageTone} tone)`
            : 'Current Mood: Unknown'

        const responseGuidance = `Response Preferences: ${context.responsePreferences.preferredTone} tone, ${context.responsePreferences.responseLength} length, ${context.responsePreferences.emojiPreference} emoji usage`

        const conversationMemory = context.conversationHistory.topics.length > 0
            ? `Recent Topics: ${context.conversationHistory.topics.join(', ')}`
            : 'No recent topics'

        return {
            personalNotes,
            contactNotes,
            contactCategory,
            moodContext,
            responseGuidance,
            conversationMemory
        }
    }

    private getMoodBasedToneAdjustment(emotion: string): 'empathetic' | 'professional' | 'enthusiastic' | 'casual' | 'formal' | null {
        switch (emotion) {
            case 'happy':
            case 'excited':
                return 'enthusiastic'
            case 'sad':
            case 'depressed':
                return 'empathetic'
            case 'angry':
            case 'frustrated':
                return 'empathetic'
            case 'anxious':
                return 'empathetic'
            case 'neutral':
                return 'professional'
            default:
                return null
        }
    }

    private getCategoryBasedToneAdjustment(category: string): string | null {
        switch (category.toLowerCase()) {
            case 'family':
                return 'Use warm, familiar tone'
            case 'friend':
                return 'Use casual, friendly tone'
            case 'colleague':
                return 'Use professional tone'
            case 'acquaintance':
                return 'Use polite, neutral tone'
            default:
                return null
        }
    }

    private extractTopics(message1: string, message2: string): string[] {
        const text = `${message1} ${message2}`.toLowerCase()
        const topics: string[] = []

        // Simple topic extraction based on keywords
        const topicKeywords = [
            'work', 'job', 'career', 'business', 'money', 'finance',
            'family', 'home', 'house', 'apartment',
            'health', 'doctor', 'hospital', 'medicine',
            'food', 'restaurant', 'cooking', 'recipe',
            'travel', 'vacation', 'trip', 'hotel',
            'technology', 'computer', 'phone', 'internet'
        ]

        for (const keyword of topicKeywords) {
            if (text.includes(keyword) && !topics.includes(keyword)) {
                topics.push(keyword)
            }
        }

        return topics.slice(0, 5) // Limit to 5 topics
    }

    private calculateSentimentTrend(_history: PersonalContext['conversationHistory']): 'improving' | 'declining' | 'stable' {
        // This would analyze sentiment over time
        // For now, return stable
        return 'stable'
    }
}

// Export singleton instance
export const personalContextService = PersonalContextService.getInstance()