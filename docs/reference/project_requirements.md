# Project Requirements Document (PRD)

## Project Overview
**Project Name:** JStarReplyBot (ReplyBot 2.0)
**Description:** A desktop application (Electron) that automates WhatsApp replies using AI, designed as a commercial SaaS product. Steps away from "hacky scripts" to a polished, professional tool with licensing, anti-ban protections, and a user-friendly UI.
**Target Audience:** Small business owners using WhatsApp Business who need 24/7 automated customer support.

## Functional Requirements

| Requirement ID | Description | User Story | Expected Behavior / Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| FR-001 | **Electron Desktop App** | As a user, I want a downloadable `.exe` app (not a script), so that it's easy to install and runs on my PC. | App installs via wizard, runs in system tray, and has a professional React+Tailwind UI. | **MUS** |
| FR-002 | **WhatsApp QR Auth** | As a user, I want to connect my WhatsApp by scanning a QR code, so that I don't need APIs or verification. | App displays QR code from `whatsapp-web.js`; user scans; session persists locally. | **MUS** |
| FR-003 | **AI Reply Engine** | As a business owner, I want the bot to reply intelligently using AI, so that it handles complex queries. | App listens for messages, sends context to Vercel AI SDK, and posts the AI's response. | **MUS** |
| FR-004 | **Knowledge Base "Brain" (RAG)** | As a business owner, I want to upload text/PDFs, so the AI knows my business. | **RAG System:** Uses Google Gemini Embeddings to index content. Retrives relevant chunks for the AI response. | **MUS** |
| FR-005 | **Licensing System** | As a commercial user, I want to enter my license key, so that I can activate the premium software. | App validates key via LemonSqueezy/Gumroad API on startup. Blocks usage if invalid. | **MUS** |
| FR-006 | **"Safe Mode" (Anti-Ban)** | As a user, I want the bot to act human (delays, typing status), so that I don't get banned by WhatsApp. | Random delays (5-12s), "Typing..." presence before sending, rate limits. | **MUS** |
| FR-007 | **Advanced Filters** | As a user, I want control over WHO gets a reply (e.g., Groups, New Numbers). | **Settings:** "Ignore Groups" (Default: ON), "Unsaved Contacts Only" (Toggle), Blacklist/Whitelist management. | **MUS** |
| FR-008 | **Human Handover** | As a user, I want the bot to stop if a customer asks for a human, so that I can take over. | Detects "Human/Support"; tags chat; pauses automation for that chat for X hours. | **MUS** |
| FR-009 | **Auto-Update System** | As a user, I want the app to update automatically, so I always have the latest features/fixes. | App checks GitHub Releases via `electron-updater` and updates silently. | **MUS** |
| FR-010 | **Dashboard & Analytics** | As a user, I want to see how much time I've saved, so that I feel good about the subscription. | Home tab showing "Messages Sent", "Time Saved", "Leads Captured". | Future |
| FR-011 | **Multi-Persona** | As a user, I want to change the bot's tone (Sales, Support, Gen Z), so it matches my brand. | Dropdown in settings to switch system prompts/personalities. | Future |
| FR-012 | **Voice Note Handling** | As a user, I want the bot to understand voice notes, so that I don't miss audio queries. | Transcribe audio via Whisper API and reply with text. | Future |
| FR-013 | **Product Intent Detection** | As a business, I want to know WHICH product users are asking about. | AI analyzes query to extract "Product Name" and updates a "Lead" database/dashboard. | **MUS** |
| FR-014 | **Multimodal Image Support** | As a user, I want the bot to send product images or analyze customer images. | User uploads labeled images; AI can "tool call" to send them or use Gemini Vision to analyze incoming images. | Future |
| FR-015 | **Draft Mode (Semi-Auto)** | As a cautious user, I want to review replies before sending. | **Toggle:** "Auto-Send" vs "Draft Mode". In Draft Mode, AI types the reply in the chatbox but DOES NOT hit enter. | **MUS** |
| FR-016 | **Quoted Replies** | As a user, I want the bot to reply to specific messages (swipe-to-reply). | Bot uses `msg.reply()` explicitly on the target message ID to create a "quoted" reply context. | **MUS** |
| FR-017 | **Message Splitting** | As a user, I want the bot to send short, natural bursts (up to 3) instead of one wall of text. | AI splits response into 1-3 bubbles. Sends them sequentially with small delays. | **MUS** |
