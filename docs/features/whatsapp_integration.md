# WhatsApp Integration

## Overview
The core of JStarReplyBot is the integration with WhatsApp Web via `whatsapp-web.js` running in a headless Electron-controlled browser. This handles authentication, message listeners, and sending replies.

## Architecture
- **Library:** `whatsapp-web.js` (Puppeteer-based)
- **Process:** Main Process (`src/main/whatsapp.ts`)
- **Storage:** LocalAuth strategy (session saved to `.wwebjs_auth`)

## Key Components

### 1. Authentication (Ghost Auth)
- **QR Code:** Generated in Main, sent to Renderer via IPC `ON_QR`.
- **Session:** Persisted automatically.
- **Failures:** Auto-broadcasts `ON_DISCONNECTED` to UI.

### 2. Message Handling
- **Listeners:**
  - `message`: Triggers the processing pipeline.
  - `message_revoke_everyone`: Removes message from Smart Queue if it was pending.
- **Filters:**
  - `fromMe`: Ignored.
  - `ignoreGroups`: Configurable.
  - `ignoreStatuses`: Configurable.
  - `blacklist`/`whitelist`: Configurable.
  - **Unsaved Only:** Checks `contact.isMyContact` or name mismatch.

### 3. Contact Lookup Patch (Hotfix 2025-12-24)
Due to a WhatsApp Web update, the internal `Store.ContactMethods.getIsMyContact` function was moved or renamed, causing crashes in `whatsapp-web.js`.
**Fix:** We inject a polyfill into the Puppeteer page on `ready`:
```typescript
// Polyfill injection in src/main/whatsapp.ts
window.Store.ContactMethods.getIsMyContact = () => false
```
This prevents crashes while defaulting "isMyContact" to false if the native function is missing.

### 4. Sending & Safe Mode
To prevent bans, the bot mimics human behavior:
- **Typing Indicators:** `chat.sendStateTyping()` used before sending.
- **Random Delays:** Variable delay (default 5-15s) between bubbles.
- **Message Splitting:** Long messages (>500 chars) are split into up to 3 natural sentences.
- **Draft Mode:** If enabled, messages are saved to DB (`drafts`) instead of sent, waiting for user approval in the UI.

## Data Flow
`Incoming Message` -> `Smart Queue (Aggregation)` -> `AI Processing` -> `Safe Mode Delay` -> `Send`
