// Export all services for easy import
export { moodDetectionService } from './mood-detection.service'
export { analyticsService } from './analytics.service'
export { personalContextService } from './personal-context.service'
export { ContactManagementService } from './contact-management.service'

// Export types
export type {
    MoodDetectionResult,
    MoodProfile
} from './mood-detection.service'
export type {
    AnalyticsData,
    UsageMetrics,
    MessageAnalytics
} from './analytics.service'
export type {
    PersonalContext,
    ContextEnrichment
} from './personal-context.service'
export type {
    Contact,
    ContactNote,
    ContactCategory,
    ContactAssignment,
    ContactSearchFilter
} from '../../shared/types'


// Export service instances removed because they are re-exported at the top of the file.