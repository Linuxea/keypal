# KeyPal AGENTS.md

## Project

Tauri v2 AI-powered desktop pet — autonomous behavior driven by AI (DeepSeek-compatible), plugin-based extensibility, animated pixel-art sprite that roams freely on screen.

- **Frontend**: React 19 + TypeScript 5.8 + Vite 7
- **Backend**: Rust (Tauri 2)
- **Plugins**: `tauri-plugin-opener`, `tauri-plugin-store`
- **Testing**: Vitest + @testing-library/react + jsdom

## Commands

```bash
npm run dev          # Vite dev server (port 1420, strict)
npm run build        # tsc && vite build
npm run tauri dev    # Tauri dev (auto-starts Vite)
npm run tauri build  # Tauri production build
npm test             # vitest run (83 tests)
npm run test:watch   # vitest (watch mode)
```

## Architecture

```
src-tauri/src/
  main.rs          → calls keypal_lib::run()
  lib.rs           → Tauri builder, window setup
  commands.rs      → Tauri commands (exit, save_position, append_log, log_path)

src/
  main.tsx         → React entry
  App.tsx          → root: config state, window resize, menus, behavior hook
  components/
    Pet.tsx        → canvas sprite animation (requestAnimationFrame loop)
    ContextMenu.tsx → right-click: switch pet, settings, quit
    SettingsPanel.tsx → modal: pet/size/AI config
    SpeechBubble.tsx  → floating speech bubble above pet
  hooks/
    useBehavior.ts → connects BrainEngine to React state
    useDrag.ts     → Tauri startDragging + position persistence on mouseup
  lib/
    types.ts       → AppConfig, PetKind, MoodState, sprite constants
    config.ts      → Tauri store wrapper (settings.json) with in-memory fallback
    aiClient.ts    → decideBehavior() — OpenAI-compatible /v1/chat/completions
    brainEngine.ts → 10s timer → AI decision → plugin pipeline → callback
    walkController.ts → smooth window movement via RAF + Tauri setPosition
    spriteGenerator.ts → dynamic spritesheet from plugin animations
    spritesheet.ts → animation frame controller (FPS × energy)
    log.ts         → logging via Tauri append_log command
    plugins/
      types.ts     → PetPlugin, AIDecision, AnimationRegistration, etc.
      registry.ts  → PluginRegistry: register/unregister/executeDecision
      index.ts     → createRegistry() — loads all builtin plugins
      builtin/
        emotionPlugin.ts → 5 emotions (IDLE/HAPPY/FOCUSED/ANXIOUS/SLEEPY)
        actionPlugin.ts  → 6 actions (idle/walk/jump/spin/yawn/sleep)
        speechPlugin.ts  → speech bubble rules
```

## AI Decision Pipeline

```
Timer (10s) → buildContext() → buildSystemPrompt() → AI API → onDecision chain → executeDecision()
                                                                                    ├── emotion update
                                                                                    ├── action execute (walk=move window)
                                                                                    └── speech bubble
```

AI returns JSON: `{ thought, emotion: { primary, energy, mood }, action: { type, params?, description }, speech }`

## Plugin System

Plugins implement `PetPlugin` interface with hooks into 5 pipeline stages:
- `augmentSystemPrompt` — inject rules into AI prompt
- `augmentContext` — add data to AI request
- `onDecision` — intercept/modify/block AI decisions
- `animations` — register draw functions for new animations
- `actions` — register executable action types
- `emotions` — register emotion dimensions

## Key details

- **Window**: transparent, undecorated, always-on-top, skip-taskbar, `focus: false`. Size = `petSize + 32`.
- **Capabilities**: Tauri v2 uses `src-tauri/capabilities/default.json` (not allowlist).
- **Store**: `settings.json` via `@tauri-apps/plugin-store`. Config key is `"config"`.
- **Sprites**: dynamically generated from plugin animations, 32×32 frames, cached per pet+animation combo. Flip horizontally for left/right direction.
- **Drag**: uses Tauri `startDragging()`, persists logical position via store on mouseup/blur.
- **Walk**: `walkController.ts` uses RAF loop with generation counter to prevent stale callbacks.

## Gotchas

- `commands.rs` `log_dir_path()` only handles `APPDATA` (Windows). Log path will fail on Linux/macOS.
- Vite dev server **must** run on port 1420 (`strictPort: true`).
- `tsconfig.json` enforces `noUnusedLocals` and `noUnusedParameters` — unused imports/vars break `npm run build`.
- Tauri 2 APIs are lazy-imported (`await import("@tauri-apps/api/...")`) — don't import at module top-level in hooks/components.
- Window position is stored as logical pixels; `useDrag` converts physical→logical via `scaleFactor`.
- jsdom doesn't support `canvas.getContext("2d")` — `test-setup.ts` provides a stub.
- BrainEngine tests use real timers (fake timers + async fetch is unreliable).
- Plugin `action-core` depends on `emotion-core` — register order matters.
