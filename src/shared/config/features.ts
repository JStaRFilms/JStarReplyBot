

export type Edition = 'personal' | 'business' | 'dev';

export interface FeatureConfig {
    // Core Features
    smartQueue: {
        enabled: boolean;
        maxBatchSize: number;
    };
    ownerInterception: boolean;

    // Advanced / AI Features
    memory: {
        enabled: boolean;
        vectorDbPath?: string;
    };
    styleLearning: boolean;   // Mimic user writing style
    multimodal: boolean;      // Process images/audio

    // Personal Edition Features
    personalNotes: boolean;   // Personal note-taking system
    contactCategories: boolean; // Categorize contacts (family, friends, colleagues)
    contactManagement: boolean; // Full contact management system
    moodDetection: boolean;   // Detect mood from messages
    personalAnalytics: boolean; // Personal usage analytics

    // Business Edition Features
    productCatalog: boolean;  // Product catalog management
    businessProfile: boolean; // Business profile settings
    currencySettings: boolean; // Currency configuration
    businessAnalytics: boolean; // Business-specific analytics
    teamCollaboration: boolean; // Team features

    // System
    licensing: {
        enabled: boolean;
        serverUrl?: string;
    };
    debugTools: boolean;      // Show logs, raw data

    // UI / Meta
    canSwitchEdition: boolean; // Allow changing this in settings
}

export const FEATURE_DEFAULTS: Record<Edition, FeatureConfig> = {
    personal: {
        smartQueue: { enabled: true, maxBatchSize: 10 },
        ownerInterception: true,
        memory: { enabled: true },
        styleLearning: true,
        multimodal: true,

        // Personal Edition Features - Enabled
        personalNotes: true,
        contactCategories: true,
        contactManagement: true,
        moodDetection: true,
        personalAnalytics: true,

        // Business Edition Features - Disabled
        productCatalog: false,
        businessProfile: false,
        currencySettings: false,
        businessAnalytics: false,
        teamCollaboration: false,

        licensing: { enabled: false },
        debugTools: true,
        canSwitchEdition: true,
    },
    business: {
        smartQueue: { enabled: true, maxBatchSize: 5 }, // More conservative
        ownerInterception: true,
        memory: { enabled: true }, // GDPR-compliant with Forget Me
        styleLearning: false, // Professional tone preferred
        multimodal: true,

        // Personal Edition Features - Disabled
        personalNotes: false,
        contactCategories: false,
        contactManagement: false,
        moodDetection: false,
        personalAnalytics: false,

        // Business Edition Features - Enabled
        productCatalog: true,
        businessProfile: true,
        currencySettings: true,
        businessAnalytics: true,
        teamCollaboration: true,

        licensing: { enabled: true },
        debugTools: false,
        canSwitchEdition: false, // Locked
    },
    dev: {
        smartQueue: { enabled: true, maxBatchSize: 100 },
        ownerInterception: true,
        memory: { enabled: true },
        styleLearning: true,
        multimodal: true,

        // All features enabled for development
        personalNotes: true,
        contactCategories: true,
        contactManagement: true,
        moodDetection: true,
        personalAnalytics: true,
        productCatalog: true,
        businessProfile: true,
        currencySettings: true,
        businessAnalytics: true,
        teamCollaboration: true,

        licensing: { enabled: true, serverUrl: 'http://localhost:3000' },
        debugTools: true,
        canSwitchEdition: true,
    }
};

export const DEFAULT_EDITION: Edition = 'personal';

/**
 * Get feature configuration for a specific edition
 */
export function getFeatureConfig(edition: Edition): FeatureConfig {
    return FEATURE_DEFAULTS[edition] || FEATURE_DEFAULTS.personal;
}

/**
 * Check if a feature is enabled for a specific edition
 */
export function isFeatureEnabled(edition: Edition, feature: keyof FeatureConfig): boolean {
    const config = getFeatureConfig(edition);
    const featureValue = config[feature];

    if (typeof featureValue === 'boolean') {
        return featureValue;
    }

    if (typeof featureValue === 'object' && featureValue !== null) {
        return (featureValue as any).enabled !== false;
    }

    return false;
}

/**
 * Get available features for an edition
 */
export function getAvailableFeatures(edition: Edition): string[] {
    const config = getFeatureConfig(edition);
    return Object.keys(config).filter(key => isFeatureEnabled(edition, key as keyof FeatureConfig));
}
