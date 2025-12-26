# Roadmap & Issues

This document serves as the project backlog. Each item below represents a task to be tracked (or converted to a GitHub Issue).

## MUS (Minimum Usable State)

### Issue: Init Project Skeleton
**Title:** [Feature] Initialize Electron + React + TypeScript Scaffold
**Labels:** `MUS`, `infrastructure`
**User Story:** As a developer, I want a clean repo structure with Electron, React, Tailwind, and TypeScript configured, so that I can start building features.
**Proposed Solution:**
- Use `electron-vite` or manual setup.
- Configure `eslint` and `prettier`.
- Set up directory structure (`src/main`, `src/renderer`, `src/shared`).
**Acceptance Criteria:**
- [x] `pnpm dev` opens an Electron window with React loaded.
- [x] Hot Reloading works for Renderer.
- [x] Main process re-compiles on change.

---

### Issue: WhatsApp Ghost Auth
**Title:** [Feature] Implement WhatsApp QR Authentication
**Labels:** `MUS`, `core-logic`
**User Story:** As a user, I want to scan a QR code to connect my WhatsApp account.
**Proposed Solution:**
- Instantiate `whatsapp-web.js` Client in Main process.
- Listen for `qr` event.
- Send QR string to Renderer via IPC.
- Renderer displays QR code using `react-qr-code`.
- Listen for `ready` event to confirm connection.
**Acceptance Criteria:**
- [x] App displays QR Code on startup if not authenticated.
- [x] Scanning connects successfully.
- [x] "Client is ready!" log appears.
- [x] Session is restored on app restart.
- [x] **Hotfix (2025-12-24):** Contact lookup patch applied.

---

### Issue: The Brain (RAG + Gemini)
**Title:** [Feature] Implement RAG Knowledge Base with Gemini Embeddings
**Labels:** `MUS`, `ai`, `rag`
**User Story:** As a business owner, I want the bot to "read" my documents so it answers accurately without hallucinating.
**Proposed Solution:**
- **Ingestion:** User uploads PDF/Text -> App chunks text.
- **Embeddings:** Call Google Gemini Embedding API (User provides key or we proxy) to vectorize chunks.
- **Storage:** Store vectors in a local Vector Store (e.g., `Voyager` or `LanceDB` for Electron).
- **Retrieval:** On message, convert query to vector -> legacy search -> dynamic context injection.
**Acceptance Criteria:**
- [x] User uploads a PDF.
- [x] App indexes it (visible in a "Knowledge" list).
- [x] Asking a specific question from the PDF yields a correct answer.
- [x] Uses Google Gemini Embeddings (Cost-effective).

---

### Issue: Product Intent Detection
**Title:** [Feature] Implement Product Intent Extraction
**Labels:** `MUS`, `ai`, `analytics`
**User Story:** As a business, I want to know which products people are asking about so I can track demand.
**Proposed Solution:**
- After generating a reply, run a background AI task (side-effect).
- Prompt: "Analyze this conv. Did the user express interest in a product? Which one?"
- Save result to `Leads` database table.
**Acceptance Criteria:**
- [x] Dashboard shows "Top Products Enquired".
- [x] Conversation logs show "Interested in: [Product Name]".

---

### Issue: AI Reply Engine Integration
**Title:** [Feature] Connect Vercel AI SDK to WhatsApp
**Labels:** `MUS`, `ai`
**User Story:** As a user, I want the bot to reply to incoming messages using the context I provided.
**Proposed Solution:**
- In Main process, listen for `message_create` from `whatsapp-web.js`.
- Filter out status updates/own messages.
- Retrieve "Business Context" from LowDB.
- Construct prompt: `System: ${context} \n User: ${msg.body}`.
- Call Vercel AI SDK (`generateText`).
- Send response via `whatsapp-web.js` (`msg.reply()`).
**Acceptance Criteria:**
- [x] Bot replies to a text message automatically.
- [x] Bot uses the context provided in Settings.
- [x] Bot does not reply to itself.

---

### Issue: License Key Protection
**Title:** [Feature] Implement License Key Gate
**Labels:** `MUS`, `auth`
**User Story:** As a commercial user, I must enter a valid key to use the bot.
**Proposed Solution:**
- On App Init, check if "LicenseKey" exists in LowDB.
- If not, show "Enter License" modal (block other interactions).
- Validate key against a mock API (or LemonSqueezy/Gumroad real API).
- If valid, unlock app and enable `whatsapp-web.js` client.
**Acceptance Criteria:**
- [x] App prompts for key on first run.
- [x] "Start Bot" is disabled without valid key.
- [x] Mock validation works (e.g., key `TEST-123` works).

---

### Issue: Anti-Ban Safe Mode
**Title:** [Feature] Implement Human-Like Delays and Typing Indicators
**Labels:** `MUS`, `safety`
**User Story:** As a user, I want the bot to simulate human behavior to avoid bans.
**Proposed Solution:**
- Before sending reply, calculate `delay = random(5000, 12000)` ms.
- Trigger `chat.sendStateTyping()` during delay.
- Send message after delay.
- Clear typing state.
**Acceptance Criteria:**
- [x] Bot waits 5-12 seconds before replying.
- [x] "Typing..." status appears on the user's phone.

---

### Issue: Advanced Filters & Groups
**Title:** [Feature] Implement Contact & Group Filters
**Labels:** `MUS`, `logic`
**User Story:** As a user, I want to ignore groups and specific people so I don't reply to the wrong chats.
**Proposed Solution:**
- **Group Logic:** By default, ignore all messages where `chat.isGroup` is true. Add toggle to override.
- **Unsaved Logic:** Toggle "Reply only to Unsaved Contacts". Check `contact.isMyContact`.
- **Lists:** Store `blacklist` and `whitelist` arrays in LowDB. Check sender ID against these lists.
**Acceptance Criteria:**
- [x] Bot ignores group messages by default.
- [x] "Unsaved Only" mode works (ignores saved friends).
- [x] Blacklisted numbers never get a reply.

---

### Issue: Draft Mode (Semi-Auto)
**Title:** [Feature] Implement Draft Mode (Human-in-the-loop)
**Labels:** `MUS`, `ui`
**User Story:** As a user, I want to approve the AI's reply before it sends.
**Proposed Solution:**
- Toggle in UI: "Auto-Send" (Default) vs "Draft Mode".
- **Draft Logic:** If Draft Mode is ON:
  - Generate reply.
  - Do NOT call `msg.reply()`.
  - Instead, use `whatsapp-web.js` to merely TYPE the text into the input bar (if possible) OR save it as a "Pending Reply" in our own UI.
  - *Refinement:* Since we can't easily type into the real phone's input bar remotely, we will show a "Proposed Reply" notification in OUR App's UI. User clicks "Approve/Send".
**Acceptance Criteria:**
- [x] "Draft Mode" toggle exists.
- [x] If ON, bot does not send automatically.
- [x] User can see the proposed reply in the App Dashboard and click "Send".

---

### Issue: Human-Like Messaging (Splitting & Quotes)
**Title:** [Feature] Implement Quoted Replies and Message Splitting
**Labels:** `MUS`, `core-logic`, `ux`
**User Story:** As a user, I want the bot to text like a human (short bursts) and reply to specific messages.
**Proposed Solution:**
- **Quoted Replies:** Use `message.reply()` to structurally link the response to the original message ID.
- **Message Splitting:** 
  - Function `splitMessage(text): string[]`.
  - Logic: If text > 200 chars or contains `\n\n`, split into max 3 chunks.
  - Send loop: Send Chunk 1 -> Wait 1.5s -> Send Chunk 2 -> Wait 1.2s -> Send Chunk 3.
**Acceptance Criteria:**
- [x] Bot explicitly quotes the message it is replying to.
- [x] Long AI responses are broken into 2-3 separate WhatsApp bubbles.
- [x] Delays between bubbles feel natural.

---



## Future Scope

### Issue: Voice Note Support
**Title:** [Feature] Audio Transcription and Reply
**Labels:** `future-scope`, `ai`
**Description:** Use OpenAI Whisper to transcribe `.ogg` audio files from WhatsApp and reply to them.

### Issue: Multi-Persona
**Title:** [Feature] Switchable Personalities
**Labels:** `future-scope`, `ui`
**Description:** Dropdown to select "Friendly", "Professional", or "Aggressive" system prompts.

### Issue: Multimodal Image Support
**Title:** [Feature] Image Sending & Analysis (Multimodal)
**Labels:** `future-scope`, `ai`, `images`
**Description:**
1. **Sending:** Admin uploads product images with labels. AI calls tool `sendImage(label)` to reply with a photo.
2. **Analyzing:** User sends a photo. AI uses Gemini Vision to understand it (e.g., "That part is broken").
