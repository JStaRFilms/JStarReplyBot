# JStarReplyBot Project Context

## Overview
Electron + React + TypeScript desktop app for WhatsApp automation with AI-powered replies.

## Tech Stack
- **Runtime:** Electron (Main/Renderer/Preload architecture)
- **UI:** React 18 + Tailwind CSS (glassmorphism)
- **State:** Zustand
- **AI:** Groq (Llama 3.3-70B) via Vercel AI SDK
- **RAG:** LanceDB + Google Gemini Embeddings
- **WhatsApp:** whatsapp-web.js
- **DB:** LowDB (settings), LanceDB (vectors)
- **Validation:** Zod

## Key Architecture Rules
1. **Process Separation:** Main process handles whatsapp-web.js, DB, AI. Renderer is React UI only.
2. **IPC Bridge:** All main↔renderer communication via typed IPC channels in `src/shared/types.ts`
3. **No `any`:** TypeScript strict mode. Use Zod for runtime validation.
4. **Tailwind Only:** No external CSS files except `index.css` for global/animations.
5. **pnpm Only:** Never use npm or yarn.

## File Structure
```
src/
├── main/             # Electron main process
│   ├── services/     # Business logic services
│   │   ├── owner-intercept.service.ts   # Owner message detection
│   │   ├── queue.service.ts             # Smart message aggregation
│   │   ├── conversation-memory.service.ts  # LanceDB vector memory
│   │   └── multimodal.service.ts        # Image/audio/video analysis
│   ├── whatsapp.ts   # WhatsApp client + message handling
│   └── ai-engine.ts  # AI reply generation
├── preload/          # Context bridge
├── renderer/src/     # React app
│   ├── pages/        # Page components
│   ├── store/        # Zustand stores
│   └── App.tsx       # Main layout
└── shared/           # Shared types
```

## Commands
```bash
pnpm dev      # Start dev server
pnpm build    # Build for production
```
