# KeyPal AGENTS.md

Tauri v2 AI desktop pet — React 19 + TypeScript 5.8 + Vite 7 frontend, Rust backend.

## Commands

```bash
npm run dev          # Vite dev server (port 1420, strict)
npm run build        # tsc && vite build — this IS the typecheck/lint step
npm run tauri dev    # Tauri dev (auto-starts Vite)
npm run tauri build  # Tauri production build
npm test             # vitest run (79 tests, 13 files)
npm run test:watch   # vitest watch mode
npx vitest run src/lib/brainEngine.test.ts  # run a single test file
```

No separate lint, typecheck, or format command. `npm run build` runs `tsc` first — if it passes, the code is valid. No CI workflows.

## Architecture

Behavior-driven queue model. The AI picks behaviors; a local executor runs them.

### Data flow

```
BrainEngine.tick() → AI API → { thought, behaviorId, params }
  → registry.createBehavior(id, params) → executor.enqueue(behavior)

SpeechScheduler (parallel, local timer, every 3-5 ticks)
  → picks random line from speechPool → executor.enqueueOverlay(speak)

BehaviorExecutor (dual-track):
  main queue:    animation/energy/flipX — one at a time, interruptible replaces
  overlay:       speech — independent, doesn't change animation
  → onStateChange → useBehavior setState → React re-render
```

### Layered file structure

```
spriteGenerator.ts        drawBody/drawEars primitives + generateSpriteSheet engine
actions/*.ts              Draw functions + ActionDefinition (animation atoms, one per file)
behaviors/*.ts            BehaviorFactory (wraps action + execution logic + state, one per file)
behaviors/composite.ts    compose() — parallel combination with snapshot merge
behaviors/sequence.ts     sequence() — sequential combination
plugins/builtin/          PetPlugin assemblers: base, locomotion, rest
behaviorExecutor.ts       Dual-track queue executor (main + overlay)
speechScheduler.ts        Local speak timer, independent of AI
brainEngine.ts            AI tick loop + prompt builder
aiClient.ts               OpenAI-compatible API client (20s timeout, JSON extraction)
```

### Adding a new behavior (e.g., snore)

1. **`actions/snore.ts`** — draw function + `snoreDefinition: ActionDefinition`
2. **`behaviors/snore.ts`** — `snoreFactory: BehaviorFactory` (wraps the action, `start()` calls `ctx.emitState`)
3. **Plugin file** (e.g., `rest.ts`) — add factory to `behaviors` array, add speech lines to `speechPool`, update prompt

Engine, executor, scheduler, AI client — **zero changes**.

### Key interfaces

- **`Behavior`**: `{ id, interruptible, start(ctx): Promise<void>, stop?() }` — no getState; pure push via `ctx.emitState`
- **`BehaviorFactory`**: `{ id, animation?, requiresParams?, create(params?) }` — registered in plugins
- **`PetPlugin`**: `{ id, behaviors?, emotions?, speechPool?, augmentSystemPrompt? }` — 4 fields, no lifecycle hooks
- **`AIDecision`**: `{ thought, behaviorId, params? }` — AI does NOT return emotion or speech

### Plugin registration

`plugins/index.ts` registers: `base → locomotion → rest`. No dependencies. Order only affects prompt concatenation order and sprite frame layout.

## Gotchas

- **Vite dev server must run on port 1420** (`strictPort: true`).
- **`tsconfig.json`**: `noUnusedLocals` + `noUnusedParameters` — unused imports/vars break `npm run build`.
- **Tauri 2 APIs are lazy-imported** (`await import("@tauri-apps/api/...")`) — don't import at module top-level in hooks/components.
- **BehaviorState has no `emotion` field** — it was dead data (never consumed by any renderer). Don't add it back without wiring a consumer.
- **`BehaviorExecContext.emitState`** is injected by the executor constructor — behaviors call `ctx.emitState?.({ animation, energy, ... })` to push state. Never call executor methods directly from behaviors.
- **`compose()` wraps each child's emitState** with per-behavior snapshot merging — children don't know about each other.
- **`sequence()` passes ctx through** — each sub-behavior calls `ctx.emitState` naturally during transitions.
- **BrainEngine tests use real timers** — fake timers + async fetch is unreliable.
- **`useBehavior` uses `useRef` + `[]` deps** on main useEffect to avoid re-creating executor/brain on every render. A separate effect watches `aiConfig.apiKey`/`intervalSec`.
- **SpeechBubble must NOT be inside the pet wrapper div** — wrapper is only `petSize` px wide, causes shrink-to-fit (vertical text bug).
- **`commands.rs` `log_dir_path()`** only handles `APPDATA` (Windows) — log path fails on Linux/macOS.
- **Test setup**: `src/test-setup.ts` provides canvas stub (jsdom lacks `getContext("2d")`).
- **Sprites**: 32×32 frames, generated from registered animations, cached per pet+animation combo. Flip horizontally for walk direction.
- **Window**: transparent, undecorated, always-on-top, skip-taskbar, `focus: false`, `shadow: false`.
- **Store**: `settings.json` via `@tauri-apps/plugin-store`. Config key is `"config"`. `config.ts` has in-memory fallback.
- **Walk**: `walkController.ts` uses RAF loop with generation counter to prevent stale callbacks. Window position stored as logical pixels; physical→logical via `scaleFactor`.
