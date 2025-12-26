# JStarReplyBot Settings Test Plan

## Overview
This document provides a comprehensive analysis of all user-configurable settings in the JStarReplyBot project and detailed test cases to verify their functionality.

## Settings Architecture

### Data Flow
1. **Renderer Store** (`useSettingsStore`) - In-memory state management
2. **IPC Bridge** (`src/preload/index.ts`) - Electron renderer-to-main communication
3. **Main Process Handlers** (`src/main/ipc.ts`) - Business logic and validation
4. **Database Layer** (`src/main/db.ts`) - Persistence using LowDB
5. **Validation** (`src/shared/types.ts`) - Zod schema validation

### Key Files
- **Frontend**: `src/renderer/src/pages/Settings.tsx` - Main settings UI
- **Components**: `src/renderer/src/components/settings/StyleMemoryPanel.tsx`, `StyleOnboarding.tsx`
- **Store**: `src/renderer/src/store/index.ts` - Zustand store
- **Types**: `src/shared/types.ts` - Zod schemas and TypeScript types
- **Features**: `src/shared/config/features.ts` - Edition-based feature flags
- **IPC**: `src/main/ipc.ts` - Main process handlers
- **DB**: `src/main/db.ts` - Database operations

## Comprehensive Settings Checklist

### 1. App Edition Settings
**Location**: Settings.tsx lines 103-132
**Type**: Radio buttons with edition switching
**Settings**: `edition` (personal | business | dev)

**Test Cases**:
- [ ] Verify default edition is 'personal'
- [ ] Test switching between all three editions
- [ ] Verify business edition locks edition switching (when not in dev mode)
- [ ] Verify feature availability changes based on edition
- [ ] Test persistence across app restarts
- [ ] Verify UI updates immediately when edition changes

### 2. Business Profile Settings
**Location**: Settings.tsx lines 134-199
**Type**: Text inputs and radio buttons
**Settings**: 
- `businessProfile.name` (string)
- `businessProfile.industry` (string) 
- `businessProfile.targetAudience` (string)
- `businessProfile.tone` (professional | friendly | enthusiastic | formal)
- `businessProfile.description` (string)

**Test Cases**:
- [ ] Test empty string inputs
- [ ] Test special characters in business name
- [ ] Test long descriptions (textarea)
- [ ] Verify tone selection updates UI state
- [ ] Test persistence of all fields
- [ ] Verify business profile is used in AI prompts

### 3. Bot Identity Settings
**Location**: Settings.tsx lines 210-238
**Type**: Text inputs
**Settings**:
- `botName` (string)
- `currency` (string)

**Test Cases**:
- [ ] Test emoji in bot name
- [ ] Test special currency symbols (₦, $, £, €)
- [ ] Test empty bot name
- [ ] Verify bot name appears in AI responses
- [ ] Verify currency symbol used in price formatting

### 4. Automation Mode Settings
**Location**: Settings.tsx lines 240-303
**Type**: Toggle switches
**Settings**:
- `draftMode` (boolean)
- `safeModeEnabled` (boolean)
- `voiceEnabled` (boolean)
- `visionEnabled` (boolean)
- `humanHandoverEnabled` (boolean)
- `conversationMemory.enabled` (boolean)

**Test Cases**:
- [ ] Test draft mode toggle affects message flow
- [ ] Test safe mode delays are applied
- [ ] Test voice processing when enabled/disabled
- [ ] Test vision processing when enabled/disabled
- [ ] Test human handover detection
- [ ] Test conversation memory toggle
- [ ] Verify dependent settings are disabled when parent is off
- [ ] Test combination of multiple automation features

### 5. Targeting & Filters Settings
**Location**: Settings.tsx lines 305-329
**Type**: Toggle switches
**Settings**:
- `ignoreGroups` (boolean)
- `ignoreStatuses` (boolean)
- `unsavedContactsOnly` (boolean)

**Test Cases**:
- [ ] Test group message filtering
- [ ] Test status broadcast filtering
- [ ] Test saved vs unsaved contact filtering
- [ ] Test combination of multiple filters
- [ ] Verify filters work with whitelist/blacklist

### 6. Access Control Settings
**Location**: Settings.tsx lines 331-351
**Type**: String list editors
**Settings**:
- `whitelist` (string[])
- `blacklist` (string[])

**Test Cases**:
- [ ] Test adding valid phone numbers
- [ ] Test adding invalid phone numbers
- [ ] Test duplicate number handling
- [ ] Test number deletion
- [ ] Test whitelist overrides other filters
- [ ] Test blacklist prevents all replies
- [ ] Test number normalization (removing spaces, +, etc.)
- [ ] Test persistence of lists

### 7. License & System Settings
**Location**: Settings.tsx lines 353-413
**Type**: Text input, textarea, buttons
**Settings**:
- `licenseKey` (string)
- `systemPrompt` (string)

**Test Cases**:
- [ ] Test license key validation
- [ ] Test invalid license key handling
- [ ] Test license status display updates
- [ ] Test system prompt editing
- [ ] Test system prompt persistence
- [ ] Test system prompt usage in AI responses
- [ ] Test license validation error handling

### 8. Style Learning & Memory Settings
**Location**: Settings.tsx lines 201-208, StyleMemoryPanel.tsx
**Type**: Complex component with wizard
**Settings**:
- Style patterns (emoji usage, sentence style, period usage)
- Vocabulary management
- Sample messages
- Style onboarding wizard

**Test Cases**:
- [ ] Test style pattern detection
- [ ] Test vocabulary addition/deletion
- [ ] Test sample message collection
- [ ] Test style onboarding wizard flow
- [ ] Test style profile persistence
- [ ] Test style application in AI responses
- [ ] Test style memory reset functionality

### 9. Advanced Feature Flags
**Location**: src/shared/config/features.ts
**Type**: Edition-based feature configuration
**Settings**: Feature availability per edition

**Test Cases**:
- [ ] Test feature availability in personal edition
- [ ] Test feature availability in business edition
- [ ] Test feature availability in dev edition
- [ ] Test feature flag changes when edition switches
- [ ] Test business edition locks edition switching

## Detailed Test Scenarios

### Data Validation Tests
- [ ] Test Zod schema validation for all settings
- [ ] Test partial updates don't break existing settings
- [ ] Test invalid data is rejected gracefully
- [ ] Test edge cases (empty strings, very long inputs, special characters)

### Persistence Tests
- [ ] Test settings save to database correctly
- [ ] Test settings load on app startup
- [ ] Test settings survive app restarts
- [ ] Test settings survive computer restarts
- [ ] Test settings backup/restore scenarios

### UI/UX Tests
- [ ] Test responsive design on different screen sizes
- [ ] Test dark/light theme compatibility
- [ ] Test loading states and error handling
- [ ] Test success/error feedback messages
- [ ] Test keyboard navigation
- [ ] Test accessibility (screen readers, focus management)

### Integration Tests
- [ ] Test settings affect actual bot behavior
- [ ] Test settings work with WhatsApp integration
- [ ] Test settings work with AI engine
- [ ] Test settings work with knowledge base
- [ ] Test settings work with catalog system

### Edge Case Tests
- [ ] Test concurrent settings changes
- [ ] Test network failures during save operations
- [ ] Test database corruption scenarios
- [ ] Test very large whitelist/blacklist lists
- [ ] Test very long system prompts
- [ ] Test emoji and unicode handling

## Test Implementation Strategy

### Unit Tests
- Test individual setting validation functions
- Test store state management
- Test IPC communication
- Test database operations

### Integration Tests
- Test complete settings save/load cycle
- Test settings affect on bot behavior
- Test settings with real WhatsApp messages
- Test settings with AI responses

### E2E Tests
- Test full user workflow through settings UI
- Test settings persistence across app lifecycle
- Test settings with actual bot operation

### Manual Testing Checklist
- [ ] Verify all toggle switches work
- [ ] Verify all text inputs accept and save data
- [ ] Verify all list editors add/remove items
- [ ] Verify all radio buttons change selection
- [ ] Verify save buttons work
- [ ] Verify cancel/discard actions work
- [ ] Verify error states are handled gracefully
- [ ] Verify success states provide feedback

## Priority Matrix

### High Priority (Critical Functionality)
1. License key validation and status
2. Draft mode toggle (affects user workflow)
3. Safe mode delays (prevents WhatsApp bans)
4. Business profile settings (affects AI responses)
5. Whitelist/blacklist functionality (security)

### Medium Priority (Important Features)
1. Voice and vision processing toggles
2. Conversation memory settings
3. Style learning functionality
4. Filter settings (groups, statuses, unsaved contacts)
5. Bot identity settings

### Low Priority (Nice to Have)
1. Style onboarding wizard
2. Advanced feature flags
3. UI polish and animations
4. Accessibility improvements

## Test Data Requirements

### Test Phone Numbers
- Valid international formats
- Local formats
- Numbers with spaces and special characters
- Duplicate numbers
- Empty strings

### Test Business Profiles
- Empty profiles
- Profiles with special characters
- Very long descriptions
- All tone options

### Test System Prompts
- Default prompt
- Custom prompts with variables
- Very long prompts
- Prompts with emojis
- Prompts with special formatting

### Test License Keys
- Valid keys
- Invalid keys
- Expired keys
- Empty keys
- Malformed keys

## Success Criteria

1. All settings save and load correctly
2. Settings changes take effect immediately where appropriate
3. UI provides clear feedback for all actions
4. Error handling is graceful and informative
5. Settings work correctly with all bot features
6. Performance is acceptable with large datasets
7. Security is maintained (no XSS, injection vulnerabilities)
8. Accessibility standards are met
9. Cross-platform compatibility is maintained
10. Settings are resilient to app crashes and restarts