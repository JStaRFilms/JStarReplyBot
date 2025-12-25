/**
 * Style Extractor Service
 * 
 * Analyzes a set of messages to extract style patterns, vocabulary, and usage traits.
 * This runs periodically to update the owner's style profile.
 */

import { EmojiLevel, SentenceStyle, StylePatterns } from '../../shared/types'

export class StyleExtractorService {

    /**
     * Analyze a batch of messages to detect style patterns
     */
    detectPatterns(messages: string[]): StylePatterns {
        if (messages.length === 0) {
            return {
                emojiUsage: 'moderate',
                sentenceStyle: 'medium',
                endsWithPeriod: false
            }
        }

        return {
            emojiUsage: this.analyzeEmojiUsage(messages),
            sentenceStyle: this.analyzeSentenceStyle(messages),
            endsWithPeriod: this.analyzePeriodUsage(messages)
        }
    }

    /**
     * Identify frequently used words and phrases (simple frequency analysis)
     * Filters out common stop words.
     */
    extractVocabulary(messages: string[]): string[] {
        const wordCounts = new Map<string, number>()
        const stopWords = new Set([
            'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'of', 'with', 'it', 'msg'
        ])

        messages.forEach(msg => {
            // Normalize: lowercase, remove punctuation (except maybe apostrophes)
            const cleaned = msg.toLowerCase().replace(/[.,!?;:()"]/g, '')
            const words = cleaned.split(/\s+/)

            words.forEach(word => {
                if (word.length > 2 && !stopWords.has(word)) {
                    wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
                }
            })
        })

        // Sort by frequency
        const sorted = [...wordCounts.entries()].sort((a, b) => b[1] - a[1])

        // Return top 20 dominant words
        return sorted.slice(0, 20).map(([word]) => word)
    }


    /**
     * Analyze emoji density
     */
    analyzeEmojiUsage(messages: string[]): EmojiLevel {
        let totalEmojis = 0
        const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]/gu

        messages.forEach(msg => {
            const matches = msg.match(emojiRegex)
            if (matches) totalEmojis += matches.length
        })

        const avgPerMsg = totalEmojis / messages.length

        if (avgPerMsg > 1.5) return 'heavy'
        if (avgPerMsg > 0.5) return 'moderate'
        if (avgPerMsg > 0) return 'light'
        return 'none'
    }

    /**
     * Analyze sentence length preference
     */
    analyzeSentenceStyle(messages: string[]): SentenceStyle {
        let totalWords = 0

        messages.forEach(msg => {
            totalWords += msg.split(/\s+/).length
        })

        const avgWords = totalWords / messages.length

        if (avgWords < 5) return 'short'
        if (avgWords > 15) return 'long'
        return 'medium'
    }

    /**
     * Check if user typically ends sentences with a period
     * (Many casual texters drop the final period)
     */
    private analyzePeriodUsage(messages: string[]): boolean {
        let endsWithDot = 0
        let validMessages = 0

        messages.forEach(msg => {
            const trimmed = msg.trim()
            // Ignore messages ending with emoji or other punctuation like ! or ?
            if (/[!?\u{1F300}-\u{1F9FF}]$/u.test(trimmed)) return

            validMessages++
            if (trimmed.endsWith('.')) {
                endsWithDot++
            }
        })

        if (validMessages === 0) return false
        // If > 50% of declarative sentences end with period, assume yes
        return (endsWithDot / validMessages) > 0.5
    }
}

export const styleExtractorService = new StyleExtractorService()
