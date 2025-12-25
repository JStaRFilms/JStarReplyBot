/**
 * Style Profile Service
 * 
 * Manages the user's style profile (global and per-chat) in LowDB.
 * Provides methods to retrieve, update, and delete style information.
 */

import { getStyleProfile, saveStyleProfile } from '../db'
import { StyleProfile, GlobalStyle, PerChatStyle } from '../../shared/types'
import { log } from '../logger'

export class StyleProfileService {

    /**
     * Get the complete style profile
     */
    async getProfile(): Promise<StyleProfile> {
        return await getStyleProfile()
    }

    /**
     * Get style for a specific chat context.
     * Merges global style with per-chat overrides.
     */
    async getStyleForChat(chatId: string): Promise<GlobalStyle> {
        const profile = await getStyleProfile()
        const chatStyle = profile.perChat[chatId]

        if (!chatStyle) {
            return profile.global
        }

        // Merge global with overrides
        return {
            ...profile.global,
            ...chatStyle.styleOverrides,
            // Merge vocabulary lists distinctively
            vocabulary: [...new Set([
                ...(profile.global.vocabulary || []),
                ...(chatStyle.styleOverrides.vocabulary || [])
            ])],
            bannedPhrases: [...new Set([
                ...(profile.global.bannedPhrases || []),
                ...(chatStyle.styleOverrides.bannedPhrases || [])
            ])],
            // Use specific sample messages if available, otherwise fall back to global
            sampleMessages: (chatStyle.sampleMessages && chatStyle.sampleMessages.length > 0)
                ? chatStyle.sampleMessages
                : profile.global.sampleMessages
        }
    }

    /**
     * Update global style patterns derived from analysis
     */
    async updateGlobalStyle(patterns: Partial<GlobalStyle>): Promise<void> {
        const profile = await getStyleProfile()

        const updatedGlobal: GlobalStyle = {
            ...profile.global,
            ...patterns,
            // Deep merge patterns object
            patterns: {
                ...profile.global.patterns,
                ...(patterns.patterns || {})
            }
        }

        await saveStyleProfile({ global: updatedGlobal })
        log('INFO', 'Updated global style profile')
    }

    /**
     * Set a per-chat override
     */
    async setChatOverride(chatId: string, override: Partial<PerChatStyle>): Promise<void> {
        const profile = await getStyleProfile()

        const currentChat = profile.perChat[chatId] || {
            styleOverrides: {},
            sampleMessages: []
        }

        const updatedChat: PerChatStyle = {
            ...currentChat,
            ...override,
            styleOverrides: {
                ...currentChat.styleOverrides,
                ...(override.styleOverrides || {})
            }
        }

        await saveStyleProfile({
            perChat: {
                ...profile.perChat,
                [chatId]: updatedChat
            }
        })
        log('INFO', `Updated style override for chat ${chatId}`)
    }

    /**
     * Add a learned vocabulary item
     */
    async addVocabulary(word: string): Promise<void> {
        const profile = await getStyleProfile()
        if (!profile.global.vocabulary.includes(word)) {
            await this.updateGlobalStyle({
                vocabulary: [...profile.global.vocabulary, word]
            })
        }
    }

    /**
     * Remove a vocabulary item (correction)
     */
    async removeVocabulary(word: string): Promise<void> {
        const profile = await getStyleProfile()
        await this.updateGlobalStyle({
            vocabulary: profile.global.vocabulary.filter(w => w !== word)
        })
    }

    /**
     * Add a sample message manually or from extraction
     */
    async addGlobalSample(message: string): Promise<void> {
        const profile = await getStyleProfile()
        // Keep max 20 samples globally
        const newSamples = [message, ...profile.global.sampleMessages].slice(0, 20)
        await this.updateGlobalStyle({ sampleMessages: newSamples })
    }
}

export const styleProfileService = new StyleProfileService()
