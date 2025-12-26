# Personal Edition Features Test Cases

## Overview
This document contains comprehensive test cases for the Personal edition features implemented in JStarReplyBot, including Personal Notes, Mood Detection, Contact Categories, and Personal Analytics.

## Personal Notes Tests

### PN-001: Personal Notes Panel Visibility
- **ID**: PN-001
- **Description**: Test Personal Notes panel appears in Personal edition
- **Preconditions**: App running in Personal edition
- **Steps**:
  1. Navigate to Settings page
  2. Verify Personal Notes section is visible
- **Expected Result**: Personal Notes panel is displayed
- **Priority**: High

### PN-002: Add New Personal Note
- **ID**: PN-002
- **Description**: Test adding a new personal note
- **Preconditions**: Personal Notes panel visible
- **Steps**:
  1. Fill in note title and content
  2. Select a category (optional)
  3. Click Add Note
- **Expected Result**: Note is added to the list successfully
- **Priority**: High

### PN-003: Edit Existing Personal Note
- **ID**: PN-003
- **Description**: Test editing an existing personal note
- **Preconditions**: Personal notes exist in the list
- **Steps**:
  1. Click edit button on a note
  2. Modify title, content, or category
  3. Click Save
- **Expected Result**: Note is updated with new content
- **Priority**: Medium

### PN-004: Delete Personal Note
- **ID**: PN-004
- **Description**: Test deleting a personal note
- **Preconditions**: Personal notes exist in the list
- **Steps**:
  1. Click delete button on a note
  2. Confirm deletion
- **Expected Result**: Note is removed from the list
- **Priority**: Medium

### PN-005: Note Categories Integration
- **ID**: PN-005
- **Description**: Test personal notes integrate with contact categories
- **Preconditions**: Contact categories exist
- **Steps**:
  1. Create contact categories
  2. Add notes with category assignments
  3. Verify category dropdown shows available categories
- **Expected Result**: Notes can be categorized using contact categories
- **Priority**: Medium

### PN-006: Note Persistence
- **ID**: PN-006
- **Description**: Test personal notes persist across app restarts
- **Preconditions**: Personal notes exist
- **Steps**:
  1. Create several notes
  2. Restart the application
  3. Verify notes are still available
- **Expected Result**: All notes are preserved after restart
- **Priority**: High

## Contact Categories Tests

### CC-001: Contact Categories Panel Visibility
- **ID**: CC-001
- **Description**: Test Contact Categories panel appears in Personal edition
- **Preconditions**: App running in Personal edition
- **Steps**:
  1. Navigate to Settings page
  2. Verify Contact Categories section is visible
- **Expected Result**: Contact Categories panel is displayed
- **Priority**: High

### CC-002: Add New Contact Category
- **ID**: CC-002
- **Description**: Test adding a new contact category
- **Preconditions**: Contact Categories panel visible
- **Steps**:
  1. Fill in category name and color
  2. Optionally add description
  3. Click Add Category
- **Expected Result**: Category is added to the list successfully
- **Priority**: High

### CC-003: Edit Contact Category
- **ID**: CC-003
- **Description**: Test editing an existing contact category
- **Preconditions**: Contact categories exist
- **Steps**:
  1. Click edit button on a category
  2. Modify name, color, or description
  3. Click Save
- **Expected Result**: Category is updated with new information
- **Priority**: Medium

### CC-004: Delete Contact Category
- **ID**: CC-004
- **Description**: Test deleting a contact category
- **Preconditions**: Contact categories exist
- **Steps**:
  1. Click delete button on a category
  2. Confirm deletion
- **Expected Result**: Category is removed from the list
- **Priority**: Medium

### CC-005: Color Picker Functionality
- **ID**: CC-005
- **Description**: Test color picker for contact categories
- **Preconditions**: Contact Categories panel visible
- **Steps**:
  1. Click color picker
  2. Select different colors
  3. Verify color preview updates
- **Expected Result**: Color picker works and displays selected color
- **Priority**: Medium

### CC-006: Category Persistence
- **ID**: CC-006
- **Description**: Test contact categories persist across app restarts
- **Preconditions**: Contact categories exist
- **Steps**:
  1. Create several categories
  2. Restart the application
  3. Verify categories are still available
- **Expected Result**: All categories are preserved after restart
- **Priority**: High

## Mood Detection Tests

### MD-001: Mood Detection Panel Visibility
- **ID**: MD-001
- **Description**: Test Mood Detection panel appears in Personal edition
- **Preconditions**: App running in Personal edition
- **Steps**:
  1. Navigate to Settings page
  2. Verify Mood Detection section is visible
- **Expected Result**: Mood Detection panel is displayed
- **Priority**: High

### MD-002: Enable/Disable Mood Detection
- **ID**: MD-002
- **Description**: Test toggling mood detection on/off
- **Preconditions**: Mood Detection panel visible
- **Steps**:
  1. Toggle mood detection switch to ON
  2. Verify advanced settings appear
  3. Toggle mood detection switch to OFF
  4. Verify advanced settings disappear
- **Expected Result**: Toggle works and UI updates accordingly
- **Priority**: High

### MD-003: Sensitivity Level Selection
- **ID**: MD-003
- **Description**: Test mood detection sensitivity levels
- **Preconditions**: Mood detection enabled
- **Steps**:
  1. Select Low sensitivity
  2. Select Medium sensitivity
  3. Select High sensitivity
  4. Verify selection is highlighted
- **Expected Result**: Sensitivity levels can be selected and persist
- **Priority**: Medium

### MD-004: Auto-Respond Toggle
- **ID**: MD-004
- **Description**: Test auto-respond to mood toggle
- **Preconditions**: Mood detection enabled
- **Steps**:
  1. Toggle auto-respond to ON
  2. Toggle auto-respond to OFF
- **Expected Result**: Auto-respond setting can be toggled
- **Priority**: Medium

### MD-005: Mood Detection Details
- **ID**: MD-005
- **Description**: Test mood detection details and explanations
- **Preconditions**: Mood detection enabled
- **Steps**:
  1. Click "Show Details" button
  2. Verify detailed explanations appear
  3. Click "Hide Details" button
  4. Verify details disappear
- **Expected Result**: Details toggle works and shows helpful information
- **Priority**: Low

### MD-006: Mood Detection Logic (Backend)
- **ID**: MD-006
- **Description**: Test mood detection actually analyzes messages
- **Preconditions**: Bot connected and running
- **Steps**:
  1. Enable mood detection with high sensitivity
  2. Send messages with different emotional content
  3. Check if mood is detected and logged
- **Expected Result**: Messages are analyzed for mood content
- **Priority**: Medium

## Personal Analytics Tests

### PA-001: Personal Analytics Panel Visibility
- **ID**: PA-001
- **Description**: Test Personal Analytics panel appears in Personal edition
- **Preconditions**: App running in Personal edition
- **Steps**:
  1. Navigate to Settings page
  2. Verify Personal Analytics section is visible
- **Expected Result**: Personal Analytics panel is displayed
- **Priority**: High

### PA-002: Enable/Disable Analytics
- **ID**: PA-002
- **Description**: Test toggling personal analytics on/off
- **Preconditions**: Personal Analytics panel visible
- **Steps**:
  1. Toggle analytics switch to ON
  2. Verify display options appear
  3. Toggle analytics switch to OFF
  4. Verify display options disappear
- **Expected Result**: Toggle works and UI updates accordingly
- **Priority**: High

### PA-003: Display Options Toggles
- **ID**: PA-003
- **Description**: Test individual analytics display toggles
- **Preconditions**: Analytics enabled
- **Steps**:
  1. Toggle Daily Stats ON/OFF
  2. Toggle Weekly Stats ON/OFF
  3. Toggle Monthly Stats ON/OFF
- **Expected Result**: Each statistic type can be individually toggled
- **Priority**: Medium

### PA-004: Sample Data Display
- **ID**: PA-004
- **Description**: Test sample analytics data display
- **Preconditions**: Analytics enabled
- **Steps**:
  1. Click "Show Sample Data"
  2. Verify sample statistics appear
  3. Verify data is displayed in appropriate cards
- **Expected Result**: Sample data is shown in a clear, organized format
- **Priority**: Medium

### PA-005: Analytics Data Persistence
- **ID**: PA-005
- **Description**: Test analytics data persists and accumulates
- **Preconditions**: Bot has been active
- **Steps**:
  1. Use the bot for some time
  2. Check analytics data
  3. Restart application
  4. Verify data is preserved
- **Expected Result**: Analytics data accumulates and persists
- **Priority**: Medium

### PA-006: Privacy Notice
- **ID**: PA-006
- **Description**: Test privacy notice for analytics data
- **Preconditions**: Analytics enabled
- **Steps**:
  1. View analytics section
  2. Verify privacy notice is displayed
- **Expected Result**: Clear notice about data storage and privacy
- **Priority**: Low

## Feature Integration Tests

### FI-001: Edition Feature Switching
- **ID**: FI-001
- **Description**: Test Personal edition features appear/disappear correctly
- **Preconditions**: App running
- **Steps**:
  1. Switch to Personal edition
  2. Verify Personal Notes, Mood Detection, etc. appear
  3. Switch to Business edition
  4. Verify Personal features disappear
- **Expected Result**: Features correctly toggle based on edition
- **Priority**: High

### FI-002: Settings Persistence Across Editions
- **ID**: FI-002
- **Description**: Test settings persist when switching editions
- **Preconditions**: Personal edition features configured
- **Steps**:
  1. Configure Personal Notes, Categories, etc.
  2. Switch to Business edition
  3. Switch back to Personal edition
  4. Verify settings are preserved
- **Expected Result**: Personal edition settings are maintained
- **Priority**: High

### FI-003: Feature Dependencies
- **ID**: FI-003
- **Description**: Test feature dependencies work correctly
- **Preconditions**: App running in Personal edition
- **Steps**:
  1. Create contact categories
  2. Verify they appear in Personal Notes category dropdown
  3. Test integration between features
- **Expected Result**: Features work together seamlessly
- **Priority**: Medium

## Backend Integration Tests

### BI-001: Settings Database Storage
- **ID**: BI-001
- **Description**: Test Personal edition settings are stored in database
- **Preconditions**: Settings configured
- **Steps**:
  1. Configure Personal Notes, Mood Detection, etc.
  2. Save settings
  3. Check database file
- **Expected Result**: All Personal edition settings are saved to database
- **Priority**: High

### BI-002: Settings Loading from Database
- **ID**: BI-002
- **Description**: Test Personal edition settings load from database
- **Preconditions**: Settings previously saved
- **Steps**:
  1. Restart application
  2. Verify all Personal edition settings are loaded
- **Expected Result**: Settings are correctly restored from database
- **Priority**: High

### BI-003: Zod Schema Validation
- **ID**: BI-003
- **Description**: Test Personal edition settings validate with Zod schema
- **Preconditions**: Settings page loaded
- **Steps**:
  1. Enter invalid data in Personal edition fields
  2. Attempt to save
- **Expected Result**: Invalid data is rejected with clear error messages
- **Priority**: Medium

## Test Execution Notes

### Test Environment Setup
- Use both development and production builds
- Test on different operating systems (Windows, macOS, Linux)
- Test with different WhatsApp accounts
- Test with different AI providers (if applicable)
- Test both Personal and Business editions

### Test Data Preparation
- Prepare test phone numbers in various formats
- Create test business profiles with different characteristics
- Prepare test license keys (valid, invalid, expired)
- Create test system prompts with various content
- Create test personal notes with different categories
- Create test contact categories with various colors and descriptions
- Prepare test messages with different emotional content for mood detection

### Test Automation
- Consider automating high-priority test cases
- Use Electron testing frameworks for UI tests
- Implement unit tests for individual components
- Create integration tests for complete workflows
- Test feature switching between editions automatically

### Test Reporting
- Document all test results
- Track test coverage for Personal edition features
- Report any issues found with specific feature implementations
- Verify fixes for reported issues
- Test both frontend UI and backend data persistence