# Coding Guidelines

## The Blueprint and Build Protocol (Mandatory)

This protocol governs the entire lifecycle of creating any non-trivial feature.

### Phase 1: The Blueprint (Planning & Documentation)
Before writing code, a plan MUST be created in `docs/features/FeatureName.md`. This plan must detail:
- High-Level Goal
- Component Breakdown (label "Server" or "Client" / "Main" or "Renderer")
- Logic & Data Breakdown (hooks, IPC channels)
- Database Schema Changes (e.g., LowDB updates)
- Step-by-Step Implementation Plan

**This plan requires human approval before proceeding.**

### Phase 2: The Build (Iterative Implementation)
Execute the plan one step at a time. Present code AND updated documentation after each step.
Wait for "proceed" signal before continuing.

### Phase 3: Finalization
Announce completion. Present final documentation. Provide integration instructions.

---

## Technical Stack Guidelines

### 0. Package Manager
- **pnpm Only:** All commands (`install`, `dev`, `build`) must use `pnpm`. Do not use `npm` or `yarn` to avoid lockfile conflicts.

### 1. Electron & Architecture
- **Process Separation:** Respect the boundary between Main and Renderer processes.
  - **Main Process:** Handles `whatsapp-web.js`, system tray, auto-updates, file system access.
  - **Renderer Process:** simple React UI. Accesses Node.js features primarily via `window.electron` preload bridge (Context Isolation).
- **Inter-Process Communication (IPC):** Use strongly typed IPC handlers. Avoid `remote` module.
- **Security:** Enable Context Isolation and Sandbox mode where possible.

### 2. React & UI (Renderer)
- **Functional Components:** Use functional components with Hooks.
- **State Management:** Use `Zustand` for global state (e.g., connection status, user settings).
- **Styling:** Tailwind CSS for all styling. No external CSS files unless for global animations.
- **UI Toolkit:** Build premium-looking components (Glassmorphism, animated transitions).

### 3. TypeScript
- **Strict Mode:** TypeScript `strict: true` must be enabled.
- **No Any:** Avoid `any`. Define interfaces for all IPC payloads and WhatsApp message objects.
- **Zod Validation:** Use `zod` to validate IPC messages and user inputs (especially License Keys and Settings).

### 4. File Structure (Feature-Sliced-ish)
- `src/main/`: Electron main process code.
- `src/preload/`: Preload scripts for IPC.
- `src/renderer/`: React application.
  - `src/renderer/components/`: Reusable UI components.
  - `src/renderer/features/`: Feature-specific logic (e.g., `dashboard`, `settings`).
  - `src/renderer/hooks/`: Custom React hooks.
- `src/shared/`: Shared types and constants between Main and Renderer.

### 5. Data Persistence (Dual Database Strategy)
- **LowDB (The Notebook):** Use for lightweight, structured data (User Settings, License Keys, Toggle States). JSON file stored in `app.getPath('userData')`.
- **LanceDB (The Brain):** Use for RAG Vectors and Embeddings. It is an embedded DB (runs in process, no server needed). Store the vector indices in a dedicated `vectors/` folder within `userData`.
- **Privacy First:** All data must stay local. No external DB connections unless for syncing (future scope).
