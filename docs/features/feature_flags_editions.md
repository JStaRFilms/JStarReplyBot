# Feature: Edition-Based Feature Flags

## Overview
The Feature Flag System allows JStarReplyBot to operate in different "Editions" (Personal, Business, Dev), each with a distinct set of enabled features. This enables a single codebase to serve multiple user personas without maintaining separate branches or builds.

## Architecture
- **Config File:** `src/shared/config/features.ts`
- **Backend Integration:** `src/main/whatsapp.ts` (checks feature flags before executing logic)
- **Frontend Integration:** `src/renderer/src/pages/Settings.tsx` (conditionally renders UI based on edition)
- **Settings Schema:** `src/shared/types.ts` (includes `edition` field in Settings)

## Key Components

### 1. Feature Configuration (`features.ts`)
Defines three editions and their feature sets:

```typescript
export type Edition = 'personal' | 'business' | 'dev';

export interface FeatureConfig {
  smartQueue: { enabled: boolean; maxBatchSize: number };
  ownerInterception: boolean;
  memory: { enabled: boolean; vectorDbPath?: string };
  styleLearning: boolean;
  multimodal: boolean;
  licensing: { enabled: boolean; serverUrl?: string };
  debugTools: boolean;
  canSwitchEdition: boolean;
}

export const FEATURE_DEFAULTS: Record<Edition, FeatureConfig> = {
  personal: { /* All features enabled */ },
  business: { /* Simplified, no Memory/Style Learning */ },
  dev: { /* All features + debug tools */ }
};
```

### 2. Backend Logic (`whatsapp.ts`)
The main message processing pipeline checks feature flags before executing advanced features:

```typescript
const features = FEATURE_DEFAULTS[settings.edition || 'personal'];

// Memory (RAG)
if (features.memory.enabled && settings.conversationMemory?.enabled !== false) {
  await embedMessage(contactNumber, 'user', combinedQuery, combinedMultimodal);
}

// Style Learning
if (features.styleLearning) {
  styleContext = await styleProfileService.getStyleForChat(contactNumber);
}

// Owner Interception
if (!features.ownerInterception) return;
```

### 3. Frontend UI (`Settings.tsx`)
The Settings page conditionally renders sections based on the current edition:

```tsx
// Edition Selector (hidden in Business mode, always visible in Dev)
{(FEATURE_DEFAULTS[settings.edition || 'personal'].canSwitchEdition || (import.meta as any).env?.DEV) && (
  <Section title="App Edition">
    {/* Segmented Control for switching editions */}
  </Section>
)}

// Style Learning Panel (Personal/Dev only)
{(features.styleLearning || features.memory.enabled) && (
  <Section title="Style Learning & Memory">
    <StyleMemoryPanel />
  </Section>
)}
```

## Edition Comparison

| Feature | Personal | Business | Dev |
|---------|----------|----------|-----|
| **Smart Queue** | ✅ (max 10) | ✅ (max 5) | ✅ (max 100) |
| **Owner Interception** | ✅ | ✅ | ✅ |
| **Conversation Memory (RAG)** | ✅ | ✅ | ✅ |
| **Style Learning** | ✅ | ❌ | ✅ |
| **Multimodal** | ✅ | ✅ | ✅ |
| **Licensing Check** | ❌ | ✅ | ✅ (localhost) |
| **Debug Tools** | ✅ | ❌ | ✅ |
| **Can Switch Edition** | ✅ | ❌ | ✅ |

## User Experience

### Personal Edition (Default)
- **Target User:** You (the developer/owner)
- **UX:** Full access to all features, including experimental ones
- **Settings UI:** Shows "App Edition" selector, Style Learning panel, Memory settings
- **Switching:** Can freely switch to Business or Dev to test

### Business Edition
- **Target User:** Paying customers
- **UX:** Simplified, production-ready experience
- **Settings UI:** No Edition selector (locked), no Style Learning panel, no Memory tweaks
- **Core Features:** Smart Queue and Owner Interception run in the background (invisible)

### Dev Edition
- **Target User:** Testing/staging environment
- **UX:** Same as Personal, but with debug logging and localhost Gatekeeper
- **Settings UI:** Full access, can switch editions

## Development Workflow

### Adding a New Feature
1. Open `src/shared/config/features.ts`
2. Add the feature flag to `FeatureConfig` interface
3. Set it to `true`/`false` for each edition in `FEATURE_DEFAULTS`
4. Wrap the feature logic in backend with `if (features.yourFeature) { ... }`
5. Conditionally render UI with `{features.yourFeature && <YourComponent />}`

### Moving a Feature Between Editions
1. Open `features.ts`
2. Change the boolean value for the target edition
3. Done. No other code changes needed.

## Safety Mechanisms

### Dev Mode Override
In development (`pnpm dev`), the Edition selector is **always visible**, even if you switch to Business mode. This prevents you from locking yourself out during testing.

```tsx
{(features.canSwitchEdition || (import.meta as any).env?.DEV) && (
  <Section title="App Edition">...</Section>
)}
```

### Production Locking
In production builds, if a user is on the Business edition, they cannot switch back to Personal (the selector is hidden).

## Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `edition` | `'personal' \| 'business' \| 'dev'` | `'personal'` | Current app edition (stored in `db.json`) |

## Changelog

### 2025-12-25: Initial Implementation
- **Created:** Feature flag system with 3 editions
- **Backend:** Applied flags to Memory, Style Learning, Owner Interception
- **Frontend:** Segmented control for edition switching, conditional rendering
- **Safety:** Dev mode override to prevent lockout during testing
