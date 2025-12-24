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

## Visual Feedback
The UI (`LiveFeed.tsx`) receives events:
- `status: 'sent'`
- `aggregatedPrompt`: Shows the combined text.
- `messageCount`: Shows how many messages were merged (e.g., "Matched 3 messages...").
