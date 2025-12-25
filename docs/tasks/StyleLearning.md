# 🎯 Task: Style Learning System

**Objective:** Build a system that learns the owner's texting style from their actual messages and applies it to AI-generated replies, making the bot sound authentically like the user.

**Priority:** High
**Scope:** Owner message collection, style extraction, per-chat overrides, UI for style review/curation

---

## 📋 Requirements

### Functional Requirements
- **[REQ-001]** Store owner messages separately with `owner` role (distinct from `assistant`)
- **[REQ-002]** Extract vocabulary patterns, emoji usage, sentence length, and banned phrases from owner messages
- **[REQ-003]** Support **Global Style** (all chats) + **Per-Chat Overrides** (specific contacts)
- **[REQ-004]** Inject relevant owner message examples into AI context (few-shot learning)
- **[REQ-005]** Provide UI panel for users to view, edit, and delete learned style patterns
- **[REQ-006]** Structured onboarding template for users to define initial style profile

### Technical Requirements
- **[TECH-001]** Use existing LanceDB for owner message storage with special `role: 'owner'` tag
- **[TECH-002]** Style profile stored in LowDB with global + per-chat structure
- **[TECH-003]** Style extraction runs periodically or on-demand (not blocking message flow)
- **[TECH-004]** TypeScript strict mode, Zod validation for style profile schema

---

## 🏗️ Implementation Plan

### Phase 1: Owner Message Storage
- [ ] Modify `owner-intercept.service.ts` to embed owner messages in LanceDB with `role: 'owner'`
- [ ] Add `embedOwnerMessage()` function in `conversation-memory.service.ts`
- [ ] Ensure owner messages are stored per-contact (chatId indexed)

### Phase 2: Style Profile Schema & Storage
- [ ] Define `StyleProfile` schema in `types.ts`:
  ```typescript
  interface StyleProfile {
    global: {
      vocabulary: string[]
      bannedPhrases: string[]
      emojiUsage: 'none' | 'light' | 'moderate' | 'heavy'
      sentenceStyle: 'short' | 'medium' | 'long'
      endsWithPeriod: boolean
      sampleMessages: string[]
    }
    perChat: {
      [contactId: string]: {
        relationship?: string
        styleOverrides: Partial<GlobalStyle>
        sampleMessages: string[]
      }
    }
  }
  ```
- [ ] Add style profile to LowDB schema in `db.ts`
- [ ] Create `style-profile.service.ts` for CRUD operations

### Phase 3: Style Extraction Engine
- [ ] Create `style-extractor.service.ts` with functions:
  - `extractVocabulary(messages: string[]): string[]` - Identify frequently used words/phrases
  - `analyzeEmojiUsage(messages: string[]): EmojiLevel`
  - `analyzeSentenceStyle(messages: string[]): SentenceStyle`
  - `detectPatterns(messages: string[]): StylePatterns`
- [ ] Run extraction periodically (e.g., every 50 owner messages) or on-demand via IPC

### Phase 4: Style Injection into AI Context
- [ ] Modify `processAggregatedMessages` in `whatsapp.ts`:
  - Retrieve global style profile
  - Retrieve per-chat overrides if applicable
  - Fetch 3-5 relevant owner messages as few-shot examples
  - Inject into system prompt dynamically
- [ ] Update `ai-engine.ts` to accept style context parameter

### Phase 5: UI for Style Management
- [ ] Create `Settings > Style Memory` panel in renderer:
  - Display learned vocabulary with usage counts
  - Show detected patterns (e.g., "Ends sentences without periods")
  - List recent owner messages used for training
  - Delete buttons for each item
- [ ] Add IPC channels: `GET_STYLE_PROFILE`, `UPDATE_STYLE_PROFILE`, `DELETE_STYLE_ITEM`

### Phase 6: Onboarding Template
- [ ] Create guided form for new users to define initial style profile
- [ ] Optional: Allow users to paste sample messages or link personal AI chats

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/main/services/style-profile.service.ts` | Create | Style profile CRUD and storage |
| `src/main/services/style-extractor.service.ts` | Create | Analyze owner messages for patterns |
| `src/main/services/owner-intercept.service.ts` | Modify | Embed owner messages with `owner` role |
| `src/main/services/conversation-memory.service.ts` | Modify | Add `embedOwnerMessage()` function |
| `src/main/whatsapp.ts` | Modify | Inject style context before AI generation |
| `src/main/ai-engine.ts` | Modify | Accept style context parameter |
| `src/main/db.ts` | Modify | Add style profile to LowDB schema |
| `src/shared/types.ts` | Modify | Add StyleProfile schema |
| `src/renderer/src/pages/Settings.tsx` | Modify | Add Style Memory panel |
| `docs/features/style_learning.md` | Create | Feature documentation |

---

## ✅ Success Criteria

### Code Quality
- [ ] TypeScript compliant (no `any`)
- [ ] Passes ESLint
- [ ] Zod validation for all style data

### Functionality
- [ ] Owner messages stored with `owner` role
- [ ] Style profile persists across sessions
- [ ] AI replies reflect learned vocabulary and patterns
- [ ] Per-chat overrides work correctly
- [ ] UI allows viewing and deleting learned items

### User Experience
- [ ] Noticeable improvement in AI tone matching owner's style after ~20 messages
- [ ] Clear feedback in UI about what was learned
- [ ] No performance degradation in message flow

---

## 🔗 Dependencies

**Depends on:**
- Owner Interception feature (completed this session)
- Conversation Memory (LanceDB) - existing
- LowDB for settings - existing

**Used by:**
- AI Reply Generation (`ai-engine.ts`)
- System Prompt construction

**Related files:**
- `src/main/services/owner-intercept.service.ts` - Owner message detection
- `src/main/services/conversation-memory.service.ts` - Vector storage
- `src/main/whatsapp.ts` - Message processing pipeline

---

## 🔄 Current State (as of 2025-12-25)

### Completed This Session
- ✅ Owner Interception feature fully implemented
- ✅ Owner messages detected via `message_create` event
- ✅ Queue pauses when owner types
- ✅ Collaborative mode with AI deciding to double-text or stay silent
- ✅ Bug fixes: timing, embed on abort

### Pending
- ⏳ Owner messages not yet stored with `owner` role (currently tracked temporarily, not persisted for learning)
- ⏳ No style extraction logic
- ⏳ No UI for style management

---

## 🚀 Getting Started

1. Read this task prompt completely
2. Review the Owner Interception implementation in `src/main/services/owner-intercept.service.ts`
3. Review conversation memory in `src/main/services/conversation-memory.service.ts`
4. Begin with Phase 1: Owner Message Storage
5. Provide progress updates after each phase
6. Deliver final results with documentation

---

*Generated by /spawn_task workflow on 2025-12-25*
