import { log } from '../logger'
import { getSettings, incrementStats } from '../db'

export interface AnalyticsData {
    messagesSent: number
    messagesReceived: number
    timeSavedMinutes: number
    averageResponseTime: number
    engagementRate: number
    moodDistribution: Record<string, number>
    peakUsageHours: number[]
    contactCategories: Record<string, number>
    responsePatterns: {
        quickReplies: number
        delayedReplies: number
        noReplies: number
    }
}

export interface UsageMetrics {
    daily: AnalyticsData
    weekly: AnalyticsData
    monthly: AnalyticsData
    allTime: AnalyticsData
}

export interface MessageAnalytics {
    messageId: string
    timestamp: number
    direction: 'sent' | 'received'
    contactId: string
    contactName?: string
    messageLength: number
    responseTime?: number
    mood?: string
    category?: string
    wasAutoReplied: boolean
    replyText?: string
}

export class AnalyticsService {
    private static instance: AnalyticsService
    private messageHistory: MessageAnalytics[] = []
    private readonly MAX_HISTORY_SIZE = 10000

    private constructor() {
        // Initialize with any existing data
    }

    public static getInstance(): AnalyticsService {
        if (!AnalyticsService.instance) {
            AnalyticsService.instance = new AnalyticsService()
        }
        return AnalyticsService.instance
    }

    /**
     * Track a message sent or received
     */
    public async trackMessage(
        messageId: string,
        direction: 'sent' | 'received',
        contactId: string,
        contactName?: string,
        messageText?: string,
        wasAutoReplied = false,
        replyText?: string
    ): Promise<void> {
        const settings = await getSettings()

        if (!settings.personalAnalytics.enabled) {
            return
        }

        const now = Date.now()
        const messageLength = messageText ? messageText.length : 0

        const analyticsEntry: MessageAnalytics = {
            messageId,
            timestamp: now,
            direction,
            contactId,
            contactName,
            messageLength,
            wasAutoReplied,
            replyText
        }

        // Calculate response time if this is a sent message
        if (direction === 'sent' && messageText) {
            const receivedMessage = this.messageHistory
                .filter(m => m.direction === 'received' && m.contactId === contactId)
                .sort((a, b) => b.timestamp - a.timestamp)[0]

            if (receivedMessage) {
                analyticsEntry.responseTime = now - receivedMessage.timestamp
            }
        }

        // Add to history
        this.messageHistory.push(analyticsEntry)

        // Maintain history size limit
        if (this.messageHistory.length > this.MAX_HISTORY_SIZE) {
            this.messageHistory = this.messageHistory.slice(-this.MAX_HISTORY_SIZE)
        }

        // Update stats
        if (direction === 'sent') {
            await incrementStats({ messagesSent: 1 })

            // Calculate time saved
            const timeSaved = this.calculateTimeSaved(messageLength, wasAutoReplied)
            await incrementStats({ timeSavedMinutes: timeSaved })
        }

        log('INFO', `Tracked ${direction} message for ${contactId} (${messageLength} chars)`)
    }

    /**
     * Get comprehensive analytics data
     */
    public async getAnalytics(): Promise<UsageMetrics> {
        const settings = await getSettings()

        if (!settings.personalAnalytics.enabled) {
            return this.getEmptyMetrics()
        }

        const now = Date.now()
        const oneDay = 24 * 60 * 60 * 1000
        const oneWeek = 7 * oneDay
        const oneMonth = 30 * oneDay

        const dailyData = this.calculateAnalyticsForPeriod(now - oneDay, now)
        const weeklyData = this.calculateAnalyticsForPeriod(now - oneWeek, now)
        const monthlyData = this.calculateAnalyticsForPeriod(now - oneMonth, now)
        const allTimeData = this.calculateAnalyticsForPeriod(0, now)

        return {
            daily: dailyData,
            weekly: weeklyData,
            monthly: monthlyData,
            allTime: allTimeData
        }
    }

    /**
     * Get specific analytics for a time period
     */
    public getAnalyticsForPeriod(startDate: Date, endDate: Date): AnalyticsData {
        const start = startDate.getTime()
        const end = endDate.getTime()

        return this.calculateAnalyticsForPeriod(start, end)
    }

    /**
     * Export analytics data
     */
    public async exportAnalytics(format: 'json' | 'csv'): Promise<string> {
        const analytics = await this.getAnalytics()

        if (format === 'json') {
            return JSON.stringify(analytics, null, 2)
        } else {
            return this.convertToCSV(analytics)
        }
    }

    /**
     * Get message history for analysis
     */
    public getMessageHistory(limit = 1000): MessageAnalytics[] {
        return this.messageHistory.slice(-limit)
    }

    /**
     * Clear analytics data
     */
    public async clearAnalytics(): Promise<void> {
        this.messageHistory = []
        log('INFO', 'Analytics data cleared')
    }

    private calculateAnalyticsForPeriod(start: number, end: number): AnalyticsData {
        const periodMessages = this.messageHistory.filter(
            m => m.timestamp >= start && m.timestamp <= end
        )

        const sentMessages = periodMessages.filter(m => m.direction === 'sent')
        const receivedMessages = periodMessages.filter(m => m.direction === 'received')

        const messagesSent = sentMessages.length
        const messagesReceived = receivedMessages.length
        const timeSavedMinutes = sentMessages.reduce((total, m) => total + (m.responseTime || 0) / 60000, 0)

        const responseTimes = sentMessages.map(m => m.responseTime).filter(Boolean) as number[]
        const averageResponseTime = responseTimes.length > 0
            ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
            : 0

        const engagementRate = messagesReceived > 0
            ? (messagesSent / messagesReceived) * 100
            : 0

        const moodDistribution = this.calculateMoodDistribution(periodMessages)
        const peakUsageHours = this.calculatePeakUsageHours(periodMessages)
        const contactCategories = this.calculateContactCategories(periodMessages)
        const responsePatterns = this.calculateResponsePatterns(sentMessages)

        return {
            messagesSent,
            messagesReceived,
            timeSavedMinutes,
            averageResponseTime,
            engagementRate,
            moodDistribution,
            peakUsageHours,
            contactCategories,
            responsePatterns
        }
    }

    private calculateMoodDistribution(messages: MessageAnalytics[]): Record<string, number> {
        const moodCounts: Record<string, number> = {}

        for (const message of messages) {
            if (message.mood) {
                moodCounts[message.mood] = (moodCounts[message.mood] || 0) + 1
            }
        }

        return moodCounts
    }

    private calculatePeakUsageHours(messages: MessageAnalytics[]): number[] {
        const hourCounts: Record<number, number> = {}

        for (const message of messages) {
            const hour = new Date(message.timestamp).getHours()
            hourCounts[hour] = (hourCounts[hour] || 0) + 1
        }

        // Get top 3 peak hours
        const sortedHours = Object.entries(hourCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([hour]) => parseInt(hour))

        return sortedHours
    }

    private calculateContactCategories(messages: MessageAnalytics[]): Record<string, number> {
        const categoryCounts: Record<string, number> = {}

        for (const message of messages) {
            const category = message.category || 'uncategorized'
            categoryCounts[category] = (categoryCounts[category] || 0) + 1
        }

        return categoryCounts
    }

    private calculateResponsePatterns(sentMessages: MessageAnalytics[]): {
        quickReplies: number
        delayedReplies: number
        noReplies: number
    } {
        const quickThreshold = 5 * 60 * 1000 // 5 minutes
        const delayedThreshold = 30 * 60 * 1000 // 30 minutes

        let quickReplies = 0
        let delayedReplies = 0
        let noReplies = 0

        for (const message of sentMessages) {
            if (message.responseTime) {
                if (message.responseTime <= quickThreshold) {
                    quickReplies++
                } else if (message.responseTime <= delayedThreshold) {
                    delayedReplies++
                }
            } else {
                noReplies++
            }
        }

        return { quickReplies, delayedReplies, noReplies }
    }

    private calculateTimeSaved(messageLength: number, wasAutoReplied: boolean): number {
        if (!wasAutoReplied) return 0

        // Estimate time saved based on message length and complexity
        const baseTimePerChar = 0.1 // seconds per character
        const complexityMultiplier = messageLength > 100 ? 1.5 : 1.0

        const estimatedTime = (messageLength * baseTimePerChar * complexityMultiplier) / 60 // Convert to minutes

        return Math.max(estimatedTime, 0.1) // Minimum 6 seconds saved
    }

    private getEmptyMetrics(): UsageMetrics {
        const emptyData: AnalyticsData = {
            messagesSent: 0,
            messagesReceived: 0,
            timeSavedMinutes: 0,
            averageResponseTime: 0,
            engagementRate: 0,
            moodDistribution: {},
            peakUsageHours: [],
            contactCategories: {},
            responsePatterns: {
                quickReplies: 0,
                delayedReplies: 0,
                noReplies: 0
            }
        }

        return {
            daily: emptyData,
            weekly: emptyData,
            monthly: emptyData,
            allTime: emptyData
        }
    }

    private convertToCSV(metrics: UsageMetrics): string {
        const headers = [
            'Period', 'Messages Sent', 'Messages Received', 'Time Saved (min)',
            'Avg Response Time (ms)', 'Engagement Rate (%)', 'Peak Hours', 'Mood Distribution'
        ]

        const rows = [
            headers.join(','),
            this.formatCSVRow('Daily', metrics.daily),
            this.formatCSVRow('Weekly', metrics.weekly),
            this.formatCSVRow('Monthly', metrics.monthly),
            this.formatCSVRow('All Time', metrics.allTime)
        ]

        return rows.join('\n')
    }

    private formatCSVRow(period: string, data: AnalyticsData): string {
        const peakHours = Object.values(data.peakUsageHours).join('-')
        const moodDist = Object.entries(data.moodDistribution)
            .map(([mood, count]) => `${mood}:${count}`)
            .join('|')

        return [
            period,
            data.messagesSent,
            data.messagesReceived,
            data.timeSavedMinutes.toFixed(2),
            data.averageResponseTime.toFixed(2),
            data.engagementRate.toFixed(2),
            peakHours,
            moodDist
        ].join(',')
    }
}

// Export singleton instance
export const analyticsService = AnalyticsService.getInstance()