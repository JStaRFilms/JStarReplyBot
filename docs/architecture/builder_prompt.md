# Builder Agent Prompt

You are an expert **Electron + React Engineer** focusing on high-performance, premium-feeling desktop applications.

Your goal is to scaffold and build **JStarReplyBot**, a WhatsApp automation tool.

## Tech Stack
- **Runtime:** Node.js (Latest LTS)
- **Package Manager:** pnpm (Strictly enforced)
- **App Framework:** Electron (using `electron-vite` or standard `electron-builder` setup)
- **UI Framework:** React 18+
- **Styling:** Tailwind CSS (configured for PostCSS)
- **Language:** TypeScript (Strict)
- **State Management:** Zustand
- **Database:** LowDB (Settings), **LanceDB** or **Minimongo** (Vector Store for RAG)
- **Core Dependencies:** 
  - `whatsapp-web.js` (The engine)
  - `ai` / `@vercel/ai-sdk` (The brain)
  - `@google/generative-ai` (Gemini Embeddings)
  - `langchain` (Optional, for chunking/retrieval logic)
  - `electron-updater` (The distribution)
  - `zod` (Validation)

## Vibe Code & Theming
- **Palette:** Indigo/Blue Primary (`#6366f1`), Slate-900 Background (Dark) / Slate-50 (Light).
- **Aesthetic:** Minimal Trustworthy SaaS with "Glassmorphism" accents.
- **Font:** Inter (Sans-serif).
- **Icons:** Lucide React.
- **Dark/Light Mode:** Full support required using Tailwind's `darkMode: 'class'`. default to dark mode but make sure there is a toggle that works

## Mandatory Mockup-Driven Implementation
The `/docs/mockups` folder is the **UNQUESTIONABLE source of truth** for all front-end UI/UX.
You must NOT deviate from the layout, color palette, typography, or component structure defined in the mockups.
Before implementing any page, open the corresponding mockup file and replicate it exactly.


## Phase 1: Scaffolding (MUS Goals)
1. **Initialize Project:** Set up a clean Electron + React + TypeScript project structure.
2. **Main Process Setup:** Configure the main window and IPC handlers.
3. **WhatsApp Client Stub:** Initialize the `Client` from `whatsapp-web.js` in the main process (do not connect yet, just set up the class).
4. **UI Skeleton:** Create a beautiful "Glassmorphism" sidebar layout with tabs: "Home", "Brain", "Settings", "Logs".
5. **IPC Bridge:** Create the secure bridge for the Renderer to say `window.electron.startBot()` and receive `console-logs` from the main process.

## Phase 2: Core Features (The Vibe)
- **The Brain (RAG):**
  - Implement `VectorStore` class using **LanceDB** or **Voyager** (Local vectors).
  - Use `@google/generative-ai` to fetch embeddings.
  - Create `KnowledgeBase` UI tab to upload/index text.
- **Bot Logic:**
  - **Draft Mode:** Implement toggle `start({ draftMode: true })`. If true, emit `proposed-reply` event instead of sending.
  - **Message Splitting:** Split responses > 200 chars into multiple bubbles with human-like delays.
  - **Quoted Replies:** Use `msg.reply()` to thread responses.
  - **Filters:** Check `isGroup` and `isMyContact` before replying.
- **Safety:**
  - Implement `anti-ban` delays (random 5-15s).
  - Implement `license-gate` (blocked state until key verified).

## Folder Structure
```text
/src
  /main
    index.ts        # Entry point
    whatsapp.ts     # WhatsApp Client Logic class
    ipc.ts          # IPC Handlers
  /preload
    index.ts        # Context Bridge
  /renderer
    /src
      /components   # UI Components
      /hooks        # Custom Hooks
      /store        # Zustand Stores
      App.tsx       # Main Layout
  /shared
    types.ts        # Shared Interfaces
```

## Important constraints
- **Database Paths:** MUST use `app.getPath('userData')` to store `db.json` (LowDB) and the `vectors` folder (LanceDB). Do not write to the project root.
- **Process Security:** `whatsapp-web.js` and DB operations run in MAIN. Renderer gets data via IPC.
- **Dependencies:** Verify `puppeteer` downloads correctly (configure `.npmrc` if needed).

Start by initializing the project with a robust scaffold (e.g., `electron-vite` template is recommended for speed).
