# KeyPal AGENTS.md

Tauri v2 AI desktop pet — React 19 + TypeScript 5.8 + Vite 7 frontend, Rust backend.

## Commands

```bash
npm run dev          # Vite dev server (port 1420, strict)
npm run build        # tsc && vite build — this IS the typecheck/lint step
npm run tauri dev    # Tauri dev (auto-starts Vite)
npm run tauri build  # Tauri production build
npm test             # vitest run (84 tests, 14 files)
npm run test:watch   # vitest watch mode
```

There is no separate lint, typecheck, or format command. `npm run build` runs `tsc` first — if it passes, the code is valid. There are no CI workflows.

## Architecture (what's not obvious from filenames)

- **AI pipeline**: Timer (default 5s, configurable) → `buildBasePrompt()` + `registry.buildSystemPrompt()` → AI API (`/v1/chat/completions`, OpenAI-compatible) → `registry.executeDecision()` → callback. AI returns JSON: `{ thought, emotion, action, speech }`.
- **No API key fallback**: `useBehavior` switches to local random actions (walk/jump/spin/yawn) on the same interval — zero AI calls.
- **`brainEngine.updateAi()`** hot-swaps AI config without recreating the engine.
- **`brainEngine.buildBasePrompt()`** injects pet personality + behavioral rules including walk coordinate examples using current screen dimensions.
- **AI client** (`aiClient.ts`): 20s timeout via AbortController. Parses JSON from response, falls back to regex extraction if the model wraps JSON in markdown.
- **Plugin registration order matters**: `action-core` depends on `emotion-core` — must register emotion first. `src/lib/plugins/index.ts` handles this.
- **Plugins hook into 5 stages**: `augmentSystemPrompt`, `augmentContext`, `onDecision`, `animations`, `actions`/`emotions`.

## Key details

- **Window**: transparent, undecorated, always-on-top, skip-taskbar, `focus: false`, `shadow: false`. Width = `Math.max(petSize + 32, 300)`. Height = `petSize + 32 + 100`.
- **Capabilities**: `src-tauri/capabilities/default.json` (Tauri v2, not allowlist).
- **Store**: `settings.json` via `@tauri-apps/plugin-store`. Config key is `"config"`. `config.ts` has in-memory fallback when store is unavailable.
- **Sprites**: dynamically generated from plugin animations, 32×32 frames, cached per pet+animation combo. Flip horizontally for left/right direction.
- **Drag**: uses Tauri `startDragging()`, persists logical position via store on mouseup/blur. Physical→logical conversion via `scaleFactor`.
- **Walk**: `walkController.ts` uses RAF loop with generation counter to prevent stale callbacks.
- **SpeechBubble**: rendered in a full-window-width flex container (NOT inside the narrow pet wrapper) to avoid shrink-to-fit width constraints.
- **Test setup**: `src/test-setup.ts` provides canvas stub (jsdom lacks `getContext("2d")`). Configured in `vite.config.ts` → `test.setupFiles`.

## Gotchas

- `commands.rs` `log_dir_path()` only handles `APPDATA` (Windows). Log path will fail on Linux/macOS.
- Vite dev server **must** run on port 1420 (`strictPort: true` in vite.config.ts, `devUrl` in tauri.conf.json).
- `tsconfig.json` enforces `noUnusedLocals` and `noUnusedParameters` — unused imports/vars break `npm run build`.
- Tauri 2 APIs are lazy-imported (`await import("@tauri-apps/api/...")`) — don't import at module top-level in hooks/components.
- Window position is stored as logical pixels; `useDrag` converts physical→logical via `scaleFactor`.
- BrainEngine tests use real timers (fake timers + async fetch is unreliable).
- `useBehavior` uses `aiConfigRef` (useRef) + `[]` dependency on main useEffect to avoid re-creating BrainEngine on every render. A separate effect watches `aiConfig.apiKey`/`intervalSec` and calls `brain.updateAi()` + restart.
- SpeechBubble must NOT be placed inside the pet wrapper div — the wrapper is only `petSize` px wide, causing absolute-positioned children to shrink-to-fit to ~48px (vertical text bug).
