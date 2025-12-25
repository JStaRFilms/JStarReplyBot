
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
        licensing: { enabled: false },
        debugTools: true,
        canSwitchEdition: true,
    },
    business: {
        smartQueue: { enabled: true, maxBatchSize: 5 }, // More conservative
        ownerInterception: true,
        memory: { enabled: false }, // Simplification for business
        styleLearning: false, // Professional tone preferred
        multimodal: true,
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
        licensing: { enabled: true, serverUrl: 'http://localhost:3000' },
        debugTools: true,
        canSwitchEdition: true,
    }
};

export const DEFAULT_EDITION: Edition = 'personal'; 
