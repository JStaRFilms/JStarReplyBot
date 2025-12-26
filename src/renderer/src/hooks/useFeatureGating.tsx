import React from 'react'
import { useSettingsStore } from '../store'
import { isFeatureEnabled } from '../../../shared/config/features'

/**
 * Custom hook for feature gating throughout the application
 * Provides easy access to feature availability based on the current edition
 */
export function useFeatureGating() {
    const { settings } = useSettingsStore()
    const edition = settings?.edition || 'personal'

    return {
        // Core Features
        smartQueue: isFeatureEnabled(edition, 'smartQueue'),
        ownerInterception: isFeatureEnabled(edition, 'ownerInterception'),

        // Advanced / AI Features
        memory: isFeatureEnabled(edition, 'memory'),
        styleLearning: isFeatureEnabled(edition, 'styleLearning'),
        multimodal: isFeatureEnabled(edition, 'multimodal'),

        // Personal Edition Features
        personalNotes: isFeatureEnabled(edition, 'personalNotes'),
        contactCategories: isFeatureEnabled(edition, 'contactCategories'),
        contactManagement: isFeatureEnabled(edition, 'contactManagement'),
        moodDetection: isFeatureEnabled(edition, 'moodDetection'),
        personalAnalytics: isFeatureEnabled(edition, 'personalAnalytics'),

        // Business Edition Features
        productCatalog: isFeatureEnabled(edition, 'productCatalog'),
        businessProfile: isFeatureEnabled(edition, 'businessProfile'),
        currencySettings: isFeatureEnabled(edition, 'currencySettings'),
        businessAnalytics: isFeatureEnabled(edition, 'businessAnalytics'),
        teamCollaboration: isFeatureEnabled(edition, 'teamCollaboration'),

        // System Features
        licensing: isFeatureEnabled(edition, 'licensing'),
        debugTools: isFeatureEnabled(edition, 'debugTools'),

        // UI / Meta
        canSwitchEdition: isFeatureEnabled(edition, 'canSwitchEdition'),

        // Current edition
        edition,

        // Utility functions
        isPersonalEdition: edition === 'personal',
        isBusinessEdition: edition === 'business',
        isDevEdition: edition === 'dev'
    }
}

/**
 * Higher-order component for feature gating
 * Wraps components and only renders them if the feature is enabled
 */
export function withFeatureGate<P extends object>(
    Component: React.ComponentType<P>,
    feature: keyof ReturnType<typeof useFeatureGating>
) {
    return function FeatureGatedComponent(props: P) {
        const features = useFeatureGating()

        if (!features[feature]) {
            return null
        }

        return <Component {...props} />
    }
}

/**
 * Utility function to check if a feature is available
 * Can be used in non-React contexts
 */
export function isFeatureAvailable(edition: string, feature: string): boolean {
    return isFeatureEnabled(edition as any, feature as any)
}