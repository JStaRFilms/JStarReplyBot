# Smart Queue Architecture

## Overview
The Smart Queue is a buffering layer between WhatsApp incoming messages and the AI Engine. Its purpose is to handle "double texters" (users who send multiple short messages in a row) by aggregating them into a single coherent prompt.

## Problem
If a user sends:
1. "Hello"
2. "I want to buy"
3. "A car"
Processing these individually would cost 3x AI credits and result in disjointed replies.

## Solution: The Smart Buffer
**File:** `src/main/services/queue.service.ts`

### Mechanism
1. **Incoming:** Message arrives from `+123456789`.
2. **Buffer:** Check if a buffer exists for this ID.
   - **No:** Create new buffer, start `bufferTimeout` (e.g., 10 seconds).
   - **Yes:** Add message to existing buffer, reset/extend timeout.
3. **Trigger:**
   - **Timeout:** If no new messages for X seconds, verify buffer.
   - **Max Limit:** If buffer exceeds `maxMessages` (e.g., 5), force process.
4. **Process:**
   - Concatenate message bodies with newlines.
   - Send SINGLE payload to AI Engine.
   - Broadcast "Queue Processed" event to UI (Live Feed).

## Configuration
- **Buffer Timeout:** 10,000ms (hardcoded in service for now, configurable in future).
- **Key:** `msg.from` (Phone Number).

---

## Owner Interception Support (2025-12-25)

The queue now supports **pausing** when the owner starts typing:

### New Methods
| Method | Description |
|--------|-------------|
| `pauseForOwner(contactId, delayMs)` | Extends the timer to give owner time to reply |
| `hasPendingBuffer(contactId)` | Check if a contact has pending messages |
| `isOwnerPaused(contactId)` | Check if buffer was paused for owner |

See `docs/features/owner_interception.md` for full details.

---

## Event Payload

The `QueueProcessedEvent` sent to the UI contains:

| Field | Type | Description |
|-------|------|-------------|
| `contactId` | string | WhatsApp ID (e.g., `+234xxx@c.us`) |
| `contactName` | string? | Display name if available |
| `messageCount` | number | How many messages were aggregated |
| `aggregatedPrompt` | string | Combined user messages |
| `reply` | string? | The AI's generated response *(new)* |
| `status` | enum | `sent`, `failed`, `skipped`, `drafted` |
| `error` | string? | Error message if failed |
| `costSaved` | number | Estimated token savings |
| `timestamp` | number | Unix timestamp |

---

## Visual Feedback (LiveFeed.tsx)

The UI (`src/renderer/src/components/LiveFeed.tsx`) renders events with:

- **Collapsed View:** Shows truncated preview (`Matched 3 messages...`)
- **Expanded View:** Click any item to see:
  - Full user messages in gray box
  - Bot reply in indigo box (if available)
  - Error details (if failed)
- **Chevron icons** indicate expand/collapse state

---

## Feature Flags

| Edition | Smart Queue |
|---------|-------------|
| Personal | ✅ (max 10) |
| Business | ✅ (max 5) |
| Dev | ✅ (max 100) |

---

## Changelog

### 2025-12-25: Owner Interception Integration
- Added `pauseForOwner()`, `hasPendingBuffer()`, `isOwnerPaused()` methods
- Queue now detects owner messages and extends buffer timer

### 2025-12-25: Reply in Event Payload
- Added `reply` field to `QueueProcessedEvent` for UI display
- LiveFeed now shows AI response in expanded view
