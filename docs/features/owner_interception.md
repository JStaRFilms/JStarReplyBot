# Owner Interception (Collaborative Mode)

## Overview
When the owner (YOU) sends a message into a conversation the bot is managing, the bot:
1. **Detects** your message via `msg.fromMe`
2. **Pauses** its pending automated reply
3. **Injects** your message into the AI context
4. **Decides** whether to add a helpful follow-up or stay silent

## How It Works

### Detection Flow
```
Customer sends 3 messages → Bot queues them (10s debounce)
Owner sends reply → Bot pauses queue (+15s), injects owner context
Timer expires → AI generates collaborative reply
                 ↓
            Safe mode delay (5-15s random wait)
                 ↓
            LAST-SECOND CHECK: Owner messaged? → Abort send
                 ↓
            Typing simulation (1-3s)
                 ↓
            SECOND CHECK: Owner messaged? → Abort send
                 ↓
            Send message (or skip if [NO_REPLY_NEEDED])
```

The interception window extends through the **entire pipeline**:
1. During the 10s queue debounce
2. During the 15s owner pause (if triggered)
3. During the 5-15s safe mode delay
4. During the typing simulation

### AI Decision Logic
The AI receives a modified prompt in collaborative mode:
- If owner's reply fully addressed the customer → `[NO_REPLY_NEEDED]`
- If AI can add value (e.g., pricing, unanswered question) → Sends a brief follow-up
- Reply mode: `[REPLY_MODE: QUOTE]` or `[REPLY_MODE: PLAIN]`

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `ownerIntercept.enabled` | `true` | Enable/disable the feature |
| `ownerIntercept.pauseDurationMs` | `15000` | Extra pause when owner types (15s) |
| `ownerIntercept.doubleTextEnabled` | `true` | Allow bot to follow up after owner |

## Files Changed

- `src/main/services/owner-intercept.service.ts` - New service tracking owner activity
- `src/main/services/queue.service.ts` - Added `pauseForOwner()`, `hasPendingBuffer()`, `isOwnerPaused()`
- `src/main/whatsapp.ts` - Owner detection in `handleIncomingMessage`, collaborative prompt injection
- `src/shared/types.ts` - New `ownerIntercept` settings schema
- `src/renderer/src/store/index.ts` - Default settings for UI

## Edge Cases

1. **Owner messages with no pending queue**: Activity is still tracked for context if customer messages later.
2. **Owner sends multiple messages**: Each message resets the pause timer.
3. **TTL expiry**: Owner context expires after 5 minutes if not used.
4. **Stale entries**: Cleanup runs every 60 seconds.
5. **New conversation clears stale context**: When a new customer message starts a fresh queue, old owner context is cleared.

---

## Hotfixes / Changelog

### Hotfix 2025-12-25: Owner Message Detection
- **Problem:** `message` event only fires for incoming messages, not outgoing (owner) messages.
- **Solution:** Added `message_create` event listener + dedicated `handleOwnerMessage()` method.

### Hotfix 2025-12-25: Stale Owner Context Applied to New Queries
- **Problem:** Owner message from previous conversation was being applied to new customer questions.
- **Solution:** Clear owner context when new queue buffer starts (no existing pending buffer).

### Hotfix 2025-12-25: Embed on Abort Bug
- **Problem:** Bot embedded reply in memory even when send was aborted.
- **Solution:** Changed `sendReplyWithSafeMode()` to return `boolean` (true=sent, false=aborted). Caller skips embed on abort.
