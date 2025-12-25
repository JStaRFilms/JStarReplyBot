# JStarReplyBot Settings Test Cases

## Test Case Format
Each test case includes:
- **ID**: Unique identifier
- **Description**: What is being tested
- **Preconditions**: Required setup
- **Steps**: Detailed test procedure
- **Expected Result**: What should happen
- **Priority**: High/Medium/Low

## App Edition Settings Tests

### ED-001: Default Edition Selection
- **ID**: ED-001
- **Description**: Verify default edition is set to 'personal'
- **Preconditions**: Fresh app installation
- **Steps**:
  1. Launch the application
  2. Navigate to Settings page
  3. Check the App Edition section
- **Expected Result**: 'Personal' edition is selected by default
- **Priority**: High

### ED-002: Edition Switching (Personal to Business)
- **ID**: ED-002
- **Description**: Test switching from personal to business edition
- **Preconditions**: App running in personal edition
- **Steps**:
  1. Navigate to Settings → App Edition
  2. Click 'Business' button
  3. Verify UI updates
- **Expected Result**: Edition changes to Business, features update accordingly
- **Priority**: High

### ED-003: Business Edition Lock (Non-Dev Mode)
- **ID**: ED-003
- **Description**: Verify business edition locks edition switching
- **Preconditions**: App in business edition, not in dev mode
- **Steps**:
  1. Switch to business edition
  2. Try to switch to another edition
- **Expected Result**: Edition buttons are disabled or switching is prevented
- **Priority**: Medium

### ED-004: Feature Availability by Edition
- **ID**: ED-004
- **Description**: Verify features change based on edition
- **Preconditions**: App running
- **Steps**:
  1. Switch to personal edition
  2. Note available features
  3. Switch to business edition
  4. Note feature changes
- **Expected Result**: Features match FEATURE_DEFAULTS configuration for each edition
- **Priority**: High

## Business Profile Tests

### BP-001: Empty Business Profile
- **ID**: BP-001
- **Description**: Test saving empty business profile
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Clear all business profile fields
  2. Click Save Changes
- **Expected Result**: Empty profile is saved successfully
- **Priority**: Medium

### BP-002: Special Characters in Business Name
- **ID**: BP-002
- **Description**: Test special characters in business name field
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Enter business name with emojis and special characters
  2. Save and verify persistence
- **Expected Result**: Special characters are preserved and displayed correctly
- **Priority**: Medium

### BP-003: Tone Selection
- **ID**: BP-003
- **Description**: Test business tone selection
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Select each tone option (professional, friendly, enthusiastic, formal)
  2. Verify selection is highlighted
  3. Save and reload
- **Expected Result**: Selected tone persists and affects AI responses
- **Priority**: High

### BP-004: Long Description Text
- **ID**: BP-004
- **Description**: Test textarea with long description
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Enter very long business description (500+ characters)
  2. Save and verify truncation/handling
- **Expected Result**: Text is saved completely without truncation
- **Priority**: Medium

## Bot Identity Tests

### BI-001: Emoji in Bot Name
- **ID**: BI-001
- **Description**: Test emoji characters in bot name
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Set bot name to "JStar🤖"
  2. Save and verify
- **Expected Result**: Emoji is preserved in bot name
- **Priority**: Medium

### BI-002: Currency Symbol Variations
- **ID**: BI-002
- **Description**: Test different currency symbols
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Test various currency symbols: $, £, €, ₦, ¥
  2. Save each and verify display
- **Expected Result**: All currency symbols display correctly
- **Priority**: High

### BI-003: Empty Bot Name
- **ID**: BI-003
- **Description**: Test empty bot name handling
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Clear bot name field
  2. Save changes
- **Expected Result**: Empty bot name is accepted and used in responses
- **Priority**: Medium

## Automation Mode Tests

### AM-001: Draft Mode Toggle
- **ID**: AM-001
- **Description**: Test draft mode affects message flow
- **Preconditions**: Bot connected and running
- **Steps**:
  1. Set draft mode to ON
  2. Send test message to bot
  3. Verify message appears in drafts
  4. Toggle draft mode OFF
  5. Send another test message
- **Expected Result**: Messages go to drafts when ON, sent directly when OFF
- **Priority**: High

### AM-002: Safe Mode Delays
- **ID**: AM-002
- **Description**: Test safe mode delay functionality
- **Preconditions**: Bot connected and running
- **Steps**:
  1. Enable safe mode
  2. Send message to bot
  3. Measure time until response
  4. Disable safe mode
  5. Send another message
- **Expected Result**: Responses are delayed when safe mode is ON
- **Priority**: High

### AM-003: Voice Processing Toggle
- **ID**: AM-003
- **Description**: Test voice note processing enable/disable
- **Preconditions**: Bot connected
- **Steps**:
  1. Enable voice processing
  2. Send voice note
  3. Verify transcription and response
  4. Disable voice processing
  5. Send another voice note
- **Expected Result**: Voice notes processed when enabled, ignored when disabled
- **Priority**: Medium

### AM-004: Vision Processing Toggle
- **ID**: AM-004
- **Description**: Test image processing enable/disable
- **Preconditions**: Bot connected
- **Steps**:
  1. Enable vision processing
  2. Send image
  3. Verify analysis and response
  4. Disable vision processing
  5. Send another image
- **Expected Result**: Images analyzed when enabled, ignored when disabled
- **Priority**: Medium

### AM-005: Human Handover Detection
- **ID**: AM-005
- **Description**: Test human handover keyword detection
- **Preconditions**: Bot connected and draft mode OFF
- **Steps**:
  1. Send message containing "human", "person", "agent"
  2. Verify message goes to drafts
  3. Send normal message
- **Expected Result**: Handover keywords trigger draft mode regardless of setting
- **Priority**: High

### AM-006: Conversation Memory Toggle
- **ID**: AM-006
- **Description**: Test conversation memory enable/disable
- **Preconditions**: Bot connected
- **Steps**:
  1. Enable conversation memory
  2. Have multiple conversations with same contact
  3. Verify context is remembered
  4. Disable conversation memory
  5. Have new conversation
- **Expected Result**: Context remembered when enabled, forgotten when disabled
- **Priority**: Medium

## Targeting & Filters Tests

### TF-001: Group Message Filtering
- **ID**: TF-001
- **Description**: Test group message filtering
- **Preconditions**: Bot connected
- **Steps**:
  1. Enable ignore groups setting
  2. Send message in group chat
  3. Verify no response
  4. Disable ignore groups
  5. Send another group message
- **Expected Result**: Group messages ignored when setting is ON
- **Priority**: High

### TF-002: Status Broadcast Filtering
- **ID**: TF-002
- **Description**: Test status broadcast filtering
- **Preconditions**: Bot connected
- **Steps**:
  1. Enable ignore statuses setting
  2. Send status update
  3. Verify no response
  4. Disable ignore statuses
  5. Send another status
- **Expected Result**: Status updates ignored when setting is ON
- **Priority**: Medium

### TF-003: Unsaved Contacts Only
- **ID**: TF-003
- **Description**: Test unsaved contacts filtering
- **Preconditions**: Bot connected with known contacts
- **Steps**:
  1. Enable unsaved contacts only setting
  2. Send message from saved contact
  3. Verify no response
  4. Send message from unsaved contact
- **Expected Result**: Only unsaved contacts receive replies
- **Priority**: Medium

### TF-004: Filter Combination
- **ID**: TF-004
- **Description**: Test multiple filters working together
- **Preconditions**: Bot connected
- **Steps**:
  1. Enable multiple filters (groups, statuses, unsaved only)
  2. Send messages from different sources
  3. Verify filter logic
- **Expected Result**: All enabled filters work together correctly
- **Priority**: Medium

## Access Control Tests

### AC-001: Whitelist Addition
- **ID**: AC-001
- **Description**: Test adding numbers to whitelist
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Enter valid phone number in whitelist
  2. Click add button
  3. Verify number appears in list
- **Expected Result**: Number is added to whitelist successfully
- **Priority**: High

### AC-002: Blacklist Addition
- **ID**: AC-002
- **Description**: Test adding numbers to blacklist
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Enter valid phone number in blacklist
  2. Click add button
  3. Verify number appears in list
- **Expected Result**: Number is added to blacklist successfully
- **Priority**: High

### AC-003: Duplicate Number Handling
- **ID**: AC-003
- **Description**: Test duplicate number prevention
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Add same number twice to whitelist
  2. Verify behavior
- **Expected Result**: Duplicate numbers are not added or are handled gracefully
- **Priority**: Medium

### AC-004: Number Deletion
- **ID**: AC-004
- **Description**: Test removing numbers from lists
- **Preconditions**: Lists contain numbers
- **Steps**:
  1. Click delete button on number
  2. Confirm deletion
  3. Verify number is removed
- **Expected Result**: Number is removed from list
- **Priority**: Medium

### AC-005: Whitelist Override
- **ID**: AC-005
- **Description**: Test whitelist overrides other filters
- **Preconditions**: Bot connected with filters enabled
- **Steps**:
  1. Add number to whitelist
  2. Enable ignore groups
  3. Send group message from whitelisted number
- **Expected Result**: Whitelisted number receives reply despite filters
- **Priority**: High

### AC-006: Blacklist Prevention
- **ID**: AC-006
- **Description**: Test blacklist prevents all replies
- **Preconditions**: Bot connected
- **Steps**:
  1. Add number to blacklist
  2. Send message from blacklisted number
- **Expected Result**: No reply sent to blacklisted numbers
- **Priority**: High

### AC-007: Number Normalization
- **ID**: AC-007
- **Description**: Test phone number normalization
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Enter number with spaces: "234 801 234 5678"
  2. Enter number with +: "+2348012345678"
  3. Verify normalization
- **Expected Result**: Numbers are normalized consistently
- **Priority**: Medium

## License & System Tests

### LS-001: Valid License Key
- **ID**: LS-001
- **Description**: Test valid license key validation
- **Preconditions**: App running with trial license
- **Steps**:
  1. Enter valid license key
  2. Click Validate button
  3. Verify status change
- **Expected Result**: License status changes to active
- **Priority**: High

### LS-002: Invalid License Key
- **ID**: LS-002
- **Description**: Test invalid license key handling
- **Preconditions**: App running
- **Steps**:
  1. Enter invalid license key
  2. Click Validate button
  3. Verify error message
- **Expected Result**: Clear error message displayed, status unchanged
- **Priority**: High

### LS-003: System Prompt Editing
- **ID**: LS-003
- **Description**: Test system prompt customization
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Edit system prompt text
  2. Save changes
  3. Send test message to bot
- **Expected Result**: AI responses reflect custom system prompt
- **Priority**: High

### LS-004: Long System Prompt
- **ID**: LS-004
- **Description**: Test very long system prompt
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Enter very long system prompt (1000+ characters)
  2. Save and verify
- **Expected Result**: Long prompt is saved and used correctly
- **Priority**: Medium

### LS-005: License Status Display
- **ID**: LS-005
- **Description**: Test license status indicator
- **Preconditions**: App running
- **Steps**:
  1. Check license status display
  2. Change license status
  3. Verify indicator updates
- **Expected Result**: Status indicator reflects current license state
- **Priority**: Medium

## Style Learning & Memory Tests

### SM-001: Style Pattern Detection
- **ID**: SM-001
- **Description**: Test automatic style pattern detection
- **Preconditions**: Bot connected and active
- **Steps**:
  1. Send several messages from phone
  2. Check Style Memory panel
  3. Verify patterns detected
- **Expected Result**: Style patterns are automatically detected and displayed
- **Priority**: Medium

### SM-002: Vocabulary Management
- **ID**: SM-002
- **Description**: Test vocabulary addition and deletion
- **Preconditions**: Style profile exists
- **Steps**:
  1. View detected vocabulary
  2. Delete vocabulary item
  3. Verify removal
- **Expected Result**: Vocabulary items can be added and removed
- **Priority**: Medium

### SM-003: Style Onboarding Wizard
- **ID**: SM-003
- **Description**: Test style onboarding wizard flow
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Click "Tune Style" button
  2. Complete wizard steps
  3. Verify style profile updates
- **Expected Result**: Wizard completes successfully, style profile updated
- **Priority**: Medium

### SM-004: Sample Message Collection
- **ID**: SM-004
- **Description**: Test sample message collection
- **Preconditions**: Bot active
- **Steps**:
  1. Send messages from phone
  2. Check sample messages in Style Memory
- **Expected Result**: Sample messages are collected and displayed
- **Priority**: Low

### SM-005: Style Application in Responses
- **ID**: SM-005
- **Description**: Test style affects AI responses
- **Preconditions**: Style profile configured
- **Steps**:
  1. Configure specific style patterns
  2. Send test messages
  3. Verify responses match style
- **Expected Result**: AI responses reflect configured style patterns
- **Priority**: Medium

## Data Validation Tests

### DV-001: Zod Schema Validation
- **ID**: DV-001
- **Description**: Test Zod schema validation for settings
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Enter invalid data (wrong types, out of range)
  2. Attempt to save
- **Expected Result**: Invalid data is rejected with clear error messages
- **Priority**: High

### DV-002: Partial Update Handling
- **ID**: DV-002
- **Description**: Test partial settings updates
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Change only one setting
  2. Save changes
  3. Verify other settings unchanged
- **Expected Result**: Only changed settings are updated, others preserved
- **Priority**: High

### DV-003: Edge Case Input Handling
- **ID**: DV-003
- **Description**: Test edge cases in input handling
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Test empty strings
  2. Test very long inputs
  3. Test special characters
  4. Test null/undefined values
- **Expected Result**: All edge cases handled gracefully without crashes
- **Priority**: Medium

## Persistence Tests

### PS-001: Settings Save to Database
- **ID**: PS-001
- **Description**: Test settings are saved to database
- **Preconditions**: App running
- **Steps**:
  1. Change settings
  2. Save changes
  3. Check database file
- **Expected Result**: Settings are written to db.json correctly
- **Priority**: High

### PS-002: Settings Load on Startup
- **ID**: PS-002
- **Description**: Test settings load on app startup
- **Preconditions**: Settings saved previously
- **Steps**:
  1. Close app
  2. Restart app
  3. Check settings are loaded
- **Expected Result**: All settings are restored from database
- **Priority**: High

### PS-003: Settings Survive App Restarts
- **ID**: PS-003
- **Description**: Test settings persist across multiple restarts
- **Preconditions**: Settings saved
- **Steps**:
  1. Restart app multiple times
  2. Verify settings each time
- **Expected Result**: Settings remain consistent across restarts
- **Priority**: High

### PS-004: Database Corruption Handling
- **ID**: PS-004
- **Description**: Test handling of corrupted database
- **Preconditions**: App running
- **Steps**:
  1. Corrupt db.json file
  2. Restart app
  3. Verify graceful handling
- **Expected Result**: App recovers with default settings or clear error
- **Priority**: Medium

## UI/UX Tests

### UX-001: Responsive Design
- **ID**: UX-001
- **Description**: Test responsive design on different screen sizes
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Resize window to different sizes
  2. Verify layout adapts correctly
- **Expected Result**: UI remains functional and readable at all sizes
- **Priority**: Medium

### UX-002: Dark/Light Theme
- **ID**: UX-002
- **Description**: Test theme compatibility
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Toggle between dark and light themes
  2. Verify settings UI adapts
- **Expected Result**: Settings UI works correctly in both themes
- **Priority**: Medium

### UX-003: Loading States
- **ID**: UX-003
- **Description**: Test loading states during operations
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Perform save operation
  2. Observe loading indicators
- **Expected Result**: Clear loading states shown during operations
- **Priority**: Medium

### UX-004: Error Handling
- **ID**: UX-004
- **Description**: Test error state handling
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Trigger various error conditions
  2. Verify error messages
- **Expected Result**: Clear, helpful error messages displayed
- **Priority**: Medium

### UX-005: Success Feedback
- **ID**: UX-005
- **Description**: Test success feedback
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Save settings successfully
  2. Observe feedback
- **Expected Result**: Clear success indication provided
- **Priority**: Medium

## Integration Tests

### IT-001: Settings Affect Bot Behavior
- **ID**: IT-001
- **Description**: Test settings actually affect bot behavior
- **Preconditions**: Bot connected and running
- **Steps**:
  1. Change various settings
  2. Send test messages
  3. Verify bot behavior changes
- **Expected Result**: Bot behavior matches setting configurations
- **Priority**: High

### IT-002: Settings with WhatsApp Integration
- **ID**: IT-002
- **Description**: Test settings work with WhatsApp integration
- **Preconditions**: Bot connected to WhatsApp
- **Steps**:
  1. Configure WhatsApp-specific settings
  2. Test with real WhatsApp messages
- **Expected Result**: Settings work correctly with live WhatsApp integration
- **Priority**: High

### IT-003: Settings with AI Engine
- **ID**: IT-003
- **Description**: Test settings work with AI engine
- **Preconditions**: Bot connected and AI configured
- **Steps**:
  1. Configure AI-related settings
  2. Send messages and verify AI responses
- **Expected Result**: AI responses reflect configured settings
- **Priority**: High

### IT-004: Settings with Knowledge Base
- **ID**: IT-004
- **Description**: Test settings work with knowledge base
- **Preconditions**: Knowledge base configured
- **Steps**:
  1. Configure knowledge base settings
  2. Test document processing
- **Expected Result**: Knowledge base functions according to settings
- **Priority**: Medium

### IT-005: Settings with Catalog System
- **ID**: IT-005
- **Description**: Test settings work with product catalog
- **Preconditions**: Catalog configured
- **Steps**:
  1. Configure catalog-related settings
  2. Test product queries
- **Expected Result**: Catalog queries work according to settings
- **Priority**: Medium

## Performance Tests

### PF-001: Large Whitelist/Blacklist
- **ID**: PF-001
- **Description**: Test performance with large access control lists
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Add 100+ numbers to whitelist
  2. Test UI responsiveness
- **Expected Result**: UI remains responsive with large lists
- **Priority**: Low

### PF-002: Large System Prompt
- **ID**: PF-002
- **Description**: Test performance with very large system prompt
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Enter very large system prompt (5000+ characters)
  2. Test save/load performance
- **Expected Result**: Performance remains acceptable with large prompts
- **Priority**: Low

### PF-003: Concurrent Settings Changes
- **ID**: PF-003
- **Description**: Test concurrent settings modifications
- **Preconditions**: Multiple processes accessing settings
- **Steps**:
  1. Modify settings from multiple sources simultaneously
  2. Verify data consistency
- **Expected Result**: Settings remain consistent under concurrent access
- **Priority**: Medium

## Security Tests

### SC-001: XSS Prevention
- **ID**: SC-001
- **Description**: Test XSS prevention in settings inputs
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Enter XSS payloads in text fields
  2. Save and verify rendering
- **Expected Result**: XSS payloads are sanitized and not executed
- **Priority**: High

### SC-002: Input Validation
- **ID**: SC-002
- **Description**: Test input validation for security
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Enter malicious input patterns
  2. Verify rejection or sanitization
- **Expected Result**: Malicious inputs are rejected or sanitized
- **Priority**: High

### SC-003: License Key Security
- **ID**: SC-003
- **Description**: Test license key handling security
- **Preconditions**: App running
- **Steps**:
  1. Enter license keys
  2. Verify secure storage and transmission
- **Expected Result**: License keys are handled securely
- **Priority**: Medium

## Accessibility Tests

### AX-001: Screen Reader Compatibility
- **ID**: AX-001
- **Description**: Test screen reader compatibility
- **Preconditions**: Screen reader available
- **Steps**:
  1. Navigate settings with screen reader
  2. Verify all elements are accessible
- **Expected Result**: All settings are accessible via screen reader
- **Priority**: Medium

### AX-002: Keyboard Navigation
- **ID**: AX-002
- **Description**: Test keyboard navigation
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Navigate all settings using keyboard only
  2. Verify all functions accessible
- **Expected Result**: All settings functions accessible via keyboard
- **Priority**: Medium

### AX-003: Focus Management
- **ID**: AX-003
- **Description**: Test focus management
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Open settings
  2. Verify focus is set appropriately
  3. Navigate through elements
- **Expected Result**: Focus is managed correctly for accessibility
- **Priority**: Medium

## Test Execution Notes

### Test Environment Setup
- Use both development and production builds
- Test on different operating systems (Windows, macOS, Linux)
- Test with different WhatsApp accounts
- Test with different AI providers (if applicable)

### Test Data Preparation
- Prepare test phone numbers in various formats
- Create test business profiles with different characteristics
- Prepare test license keys (valid, invalid, expired)
- Create test system prompts with various content

### Test Automation
- Consider automating high-priority test cases
- Use Electron testing frameworks for UI tests
- Implement unit tests for individual components
- Create integration tests for complete workflows

### Test Reporting
- Document all test results
- Track test coverage
- Report any issues found
- Verify fixes for reported issues