import { log } from '../logger'
import { getSettings } from '../db'

export interface MoodDetectionResult {
    emotion: string
    confidence: number
    tone: 'positive' | 'negative' | 'neutral'
    keywords: string[]
    suggestions: string[]
}

export interface MoodProfile {
    id: string
    contactId: string
    emotions: Record<string, number> // emotion -> confidence
    lastUpdated: number
    averageTone: 'positive' | 'negative' | 'neutral'
}

export class MoodDetectionService {
    private static instance: MoodDetectionService
    private emotionKeywords: Record<string, string[]> = {}
    private _toneModifiers: Record<string, number> = {}

    private constructor() {
        this.initializeEmotionKeywords()
        this.initializeToneModifiers()
    }

    public static getInstance(): MoodDetectionService {
        if (!MoodDetectionService.instance) {
            MoodDetectionService.instance = new MoodDetectionService()
        }
        return MoodDetectionService.instance
    }

    private initializeEmotionKeywords(): void {
        this.emotionKeywords = {
            happy: [
                'happy', 'joy', 'excited', 'great', 'awesome', 'amazing', 'wonderful',
                'fantastic', 'love', 'like', 'cool', 'nice', 'perfect', 'best',
                '😁', '😃', '😄', '😊', '😍', '🥰', '😎', '🥳', '🎉', '🎊'
            ],
            sad: [
                'sad', 'unhappy', 'depressed', 'down', 'blue', 'gloomy', 'miserable',
                'heartbroken', 'tears', 'cry', 'crying', '😞', '😢', '😭', '🙁', '😕'
            ],
            angry: [
                'angry', 'mad', 'furious', 'rage', 'hate', 'annoyed', 'frustrated',
                'pissed', 'upset', 'mad', '😡', '😠', '🤬', 'fuming', 'livid'
            ],
            frustrated: [
                'frustrated', 'stressed', 'overwhelmed', 'tired', 'exhausted', 'fed up',
                'annoyed', 'irritated', 'impatient', 'why', 'when', 'still', 'again'
            ],
            neutral: [
                'ok', 'fine', 'good', 'normal', 'average', 'standard', 'regular',
                'usual', 'typical', 'alright', 'k', 'ok', 'sure', 'yes', 'no'
            ],
            anxious: [
                'worried', 'anxious', 'nervous', 'stressed', 'tense', 'uneasy',
                'scared', 'fear', 'afraid', 'concerned', '😰', '😟', '😨', '😧'
            ],
            surprised: [
                'wow', 'oh', 'really', 'amazing', 'incredible', 'unbelievable',
                'shocking', 'unexpected', '😮', '😯', '😲', '🤯'
            ],
            confused: [
                'confused', 'lost', 'don\'t understand', 'what', 'how', 'why',
                'huh', '??', '???', 'explain', 'clarify', '🤔'
            ]
        }
    }

    private initializeToneModifiers(): void {
        this._toneModifiers = {
            'positive': 1.0,
            'negative': -1.0,
            'neutral': 0.0,
            'excited': 1.2,
            'calm': 0.5,
            'urgent': 0.8,
            'casual': 0.3
        }
    }

    /**
     * Analyze message text for emotional content
     */
    public async detectMood(message: string, contactId?: string): Promise<MoodDetectionResult> {
        const settings = await getSettings()

        if (!settings.moodDetection.enabled) {
            return {
                emotion: 'neutral',
                confidence: 0.5,
                tone: 'neutral',
                keywords: [],
                suggestions: []
            }
        }

        const text = message.toLowerCase()
        const words = this.tokenizeText(text)

        // Calculate emotion scores
        const emotionScores = this.calculateEmotionScores(words)

        // Find dominant emotion
        const dominantEmotion = this.findDominantEmotion(emotionScores)
        const confidence = emotionScores[dominantEmotion] || 0.5

        // Determine tone
        const tone = this.calculateTone(text, emotionScores)

        // Extract keywords
        const keywords = this.extractKeywords(text, dominantEmotion)

        // Generate suggestions
        const suggestions = this.generateSuggestions(dominantEmotion, tone, text)

        // Log detection result
        log('INFO', `Mood detected: ${dominantEmotion} (${confidence.toFixed(2)}) for contact ${contactId || 'unknown'}`)

        return {
            emotion: dominantEmotion,
            confidence,
            tone,
            keywords,
            suggestions
        }
    }

    /**
     * Get mood profile for a contact
     */
    public async getMoodProfile(contactId: string): Promise<MoodProfile | null> {
        // This would integrate with a persistent storage system
        // For now, return a mock profile
        return {
            id: contactId,
            contactId,
            emotions: {
                happy: 0.3,
                sad: 0.1,
                angry: 0.2,
                neutral: 0.4
            },
            lastUpdated: Date.now(),
            averageTone: 'neutral'
        }
    }

    /**
     * Update mood profile with new detection
     */
    public async updateMoodProfile(contactId: string, result: MoodDetectionResult): Promise<void> {
        // This would update the persistent storage
        log('INFO', `Updated mood profile for ${contactId}: ${result.emotion}`)
    }

    /**
     * Get response tone adjustment based on detected mood
     */
    public getResponseToneAdjustment(detectedMood: MoodDetectionResult): {
        tone: 'empathetic' | 'professional' | 'enthusiastic' | 'casual' | 'formal'
        adjustments: string[]
    } {
        const { emotion, confidence, tone: _tone } = detectedMood

        let responseTone: 'empathetic' | 'professional' | 'enthusiastic' | 'casual' | 'formal' = 'professional'
        const adjustments: string[] = []

        if (confidence > 0.7) {
            switch (emotion) {
                case 'happy':
                case 'excited':
                    responseTone = 'enthusiastic'
                    adjustments.push('Match their energy level')
                    adjustments.push('Use positive language')
                    break
                case 'sad':
                case 'depressed':
                    responseTone = 'empathetic'
                    adjustments.push('Be gentle and understanding')
                    adjustments.push('Avoid overly cheerful language')
                    adjustments.push('Offer support')
                    break
                case 'angry':
                case 'frustrated':
                    responseTone = 'empathetic'
                    adjustments.push('Stay calm and professional')
                    adjustments.push('Acknowledge their feelings')
                    adjustments.push('Avoid defensive language')
                    break
                case 'anxious':
                    responseTone = 'empathetic'
                    adjustments.push('Provide clear, reassuring information')
                    adjustments.push('Avoid overwhelming details')
                    break
                case 'neutral':
                    responseTone = 'professional'
                    adjustments.push('Maintain standard tone')
                    break
                default:
                    responseTone = 'professional'
            }
        } else {
            responseTone = 'professional'
            adjustments.push('Low confidence in mood detection')
            adjustments.push('Use neutral, professional tone')
        }

        return { tone: responseTone, adjustments }
    }

    private tokenizeText(text: string): string[] {
        // Remove emojis and special characters, convert to lowercase
        const cleanText = text.replace(/[^\w\s]/g, ' ').toLowerCase()
        return cleanText.split(/\s+/).filter(word => word.length > 0)
    }

    private calculateEmotionScores(words: string[]): Record<string, number> {
        const scores: Record<string, number> = {}

        for (const [emotion, keywords] of Object.entries(this.emotionKeywords)) {
            let score = 0
            for (const word of words) {
                if (keywords.includes(word)) {
                    score += 1
                }
            }
            // Normalize score based on message length
            scores[emotion] = Math.min(score / Math.max(words.length, 1), 1.0)
        }

        return scores
    }

    private findDominantEmotion(scores: Record<string, number>): string {
        let dominant = 'neutral'
        let maxScore = 0

        for (const [emotion, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score
                dominant = emotion
            }
        }

        return dominant
    }

    private calculateTone(text: string, emotionScores: Record<string, number>): 'positive' | 'negative' | 'neutral' {
        // Check for explicit tone indicators
        if (text.includes('!') && (emotionScores.happy || 0) > 0.3) return 'positive'
        if (text.includes('??') || text.includes('???')) return 'negative'
        if (text.includes('thank') || text.includes('please')) return 'positive'
        if (text.includes('sorry') || text.includes('apologize')) return 'negative'

        // Calculate based on emotion scores
        const positiveEmotions = ['happy', 'excited', 'amazing', 'love', 'great']
        const negativeEmotions = ['sad', 'angry', 'frustrated', 'hate', 'bad']

        let positiveScore = 0
        let negativeScore = 0

        for (const emotion of positiveEmotions) {
            positiveScore += emotionScores[emotion] || 0
        }

        for (const emotion of negativeEmotions) {
            negativeScore += emotionScores[emotion] || 0
        }

        if (positiveScore > negativeScore) return 'positive'
        if (negativeScore > positiveScore) return 'negative'

        return 'neutral'
    }

    private extractKeywords(text: string, emotion: string): string[] {
        const keywords = this.emotionKeywords[emotion] || []
        const foundKeywords: string[] = []

        for (const keyword of keywords) {
            if (text.toLowerCase().includes(keyword)) {
                foundKeywords.push(keyword)
            }
        }

        return foundKeywords.slice(0, 5) // Limit to 5 keywords
    }

    private generateSuggestions(emotion: string, _tone: 'positive' | 'negative' | 'neutral', text: string): string[] {
        const suggestions: string[] = []

        switch (emotion) {
            case 'happy':
                suggestions.push('Acknowledge their positive mood')
                suggestions.push('Keep the conversation upbeat')
                break
            case 'sad':
                suggestions.push('Show empathy and understanding')
                suggestions.push('Avoid overly cheerful responses')
                break
            case 'angry':
                suggestions.push('Stay calm and professional')
                suggestions.push('Address their concerns directly')
                break
            case 'frustrated':
                suggestions.push('Provide clear, concise answers')
                suggestions.push('Avoid adding to their frustration')
                break
            case 'anxious':
                suggestions.push('Provide reassurance')
                suggestions.push('Keep responses simple and clear')
                break
            default:
                suggestions.push('Maintain professional tone')
        }

        // Add context-specific suggestions
        if (text.includes('help')) {
            suggestions.push('Offer specific assistance')
        }
        if (text.includes('when') || text.includes('time')) {
            suggestions.push('Provide clear timeline information')
        }
        if (text.includes('why')) {
            suggestions.push('Explain the reasoning clearly')
        }

        return suggestions
    }
}

// Export singleton instance
export const moodDetectionService = MoodDetectionService.getInstance()