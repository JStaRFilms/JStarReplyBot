# Copilot Instructions for JStarReplyBot

## Architecture
- Electron app with Main/Preload/Renderer process separation
- Main process: WhatsApp client, AI, database operations
- Renderer: React UI with Zustand state management
- All IPC communication via typed channels

## Code Style
- TypeScript strict mode, no `any`
- Zod for all validation
- Tailwind CSS utility classes only
- Functional React components with hooks
- Use `window.electron.*` for IPC calls in renderer

## Key Files
- `src/shared/types.ts` - All shared types and IPC channels
- `src/main/whatsapp.ts` - WhatsApp client wrapper
- `src/main/ai-engine.ts` - Groq AI integration
- `src/renderer/src/store/index.ts` - Zustand stores

## Conventions
- Files use kebab-case
- Components use PascalCase
- IPC handlers in `src/main/ipc.ts`
- Always use `pnpm` for package management
