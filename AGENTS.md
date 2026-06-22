# KeyPal AGENTS.md

Tauri v2 AI desktop pet — React 19 + TypeScript 5.8 + Vite 7 frontend, Rust backend.

## Commands

```bash
npm run dev          # Vite dev server (port 1420, strict)
npm run build        # tsc && vite build — this IS the typecheck/lint step
npm run tauri dev    # Tauri dev (auto-starts Vite)
npm run tauri build  # Tauri production build
npm test             # vitest run (77 tests, 12 files)
npm run test:watch   # vitest watch mode
npx vitest run src/lib/brainEngine.test.ts  # run a single test file
```

No separate lint, typecheck, or format command. `npm run build` runs `tsc` first — if it passes, the code is valid. No CI workflows.

## Architecture

Behavior-driven queue model. The AI picks behaviors; a local executor runs them.

### Data flow

```
BrainEngine.tick() → AI API → { thought, behaviorId, params }
  → registry.createBehavior(id, params) → executor.enqueue(behavior)            [main: animation]
  → brain.onDecision(decision) → executor.enqueueOverlay(createSpeak(thought))   [overlay: speech]
  (thought IS the visible speech bubble; duration = intervalSec, no gaps)

BehaviorExecutor (dual-track):
  main queue:    animation/energy/flipX — one at a time, interruptible replaces
  overlay:       speech — independent, doesn't change animation
  → onStateChange → useBehavior setState → React re-render

Rendering (decoupled from engine):
  useBehavior state { animation, energy, flipX }
    → PetView picks PetArt (cat/dog/frog/chick SVG rig)
    → AnimationDriver reads ANIMATIONS[animation] (declarative per-part keyframes)
    → each RAF frame: interpolate → write `transform` attr on each <g data-part>
```

### Layered file structure

```
petArt/                   Sticker SVG rigs per pet: cat.tsx/dog.tsx/frog.tsx/chick.tsx
                          each = PetArt { viewBox, rootPivot, partPivots, palette, render(uid) }
                          render() authors nested <g data-part="..."> groups (body/head/ears/eyes/tail/legs)
animations/registry.ts    ANIMATIONS: animationId → declarative per-part keyframe tracks
animations/driver.ts      AnimationDriver: RAF loop, interpolates tracks, writes SVG transforms
behaviors/*.ts            BehaviorFactory (execution logic + emitState, one per file)
behaviors/composite.ts    compose() — parallel combination with snapshot merge
behaviors/sequence.ts     sequence() — sequential combination
plugins/builtin/          PetPlugin assemblers: base, locomotion, rest
behaviorExecutor.ts       Dual-track queue executor (main + overlay)
brainEngine.ts            AI tick loop + prompt builder
aiClient.ts               OpenAI-compatible API client (20s timeout, JSON extraction)
ui/tokens.ts              Sticker design tokens (colors, shadows, label/input styles)
components/PetView.tsx    SVG pet rig + animation driver (replaces old canvas)
components/HoverToolbar.tsx  On-hover round sticker buttons (pet/settings/quiet/quit)
```

### Adding a new behavior (e.g., dance)

1. **`animations/registry.ts`** — add a `dance` entry with per-part keyframe tracks (reuse `__root__` for whole-body motion; named parts for local motion). Missing parts on a given pet are silently ignored.
2. **`behaviors/dance.ts`** — `danceFactory: BehaviorFactory` (`start()` calls `ctx.emitState({ animation: "dance", energy })`)
3. **Plugin file** (e.g., `locomotion.ts`) — add factory to `behaviors` array, update prompt

Engine, executor, AI client, PetView, driver — **zero changes**.

### Key interfaces

- **`Behavior`**: `{ id, interruptible, start(ctx): Promise<void>, stop?() }` — no getState; pure push via `ctx.emitState`
- **`BehaviorFactory`**: `{ id, requiresParams?, create(params?) }` — registered in plugins; emits an animation id via `ctx.emitState`
- **`PetArt`**: `{ kind, viewBox, rootPivot, partPivots, palette, render(uid) }` — sticker SVG rig of nested `<g data-part>` groups
- **`AnimationDef`**: `Partial<Record<partName, PartTrack>>` — `PartTrack = { rotate?/x?/y?/scale?/scaleX?/scaleY?, dur, loop, ease? }`. Special part `__root__` wraps the whole pet (jump/spin).
- **`PetPlugin`**: `{ id, behaviors?, emotions?, speechPool?, augmentSystemPrompt? }` — `speechPool` retained but unused (speech is AI-generated via `thought`)
- **`AIDecision`**: `{ thought, behaviorId, params? }` — `thought` is the visible speech-bubble text (shown via overlay); AI does NOT return emotion

### Plugin registration

`plugins/index.ts` registers: `base → locomotion → rest`. No dependencies. Order only affects prompt concatenation order.

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
- **`thought` is the visible speech** — `brain.onDecision` in `useBehavior` forwards `decision.thought` to `executor.enqueueOverlay(createSpeak(...))`. The AI prompt instructs it to write spoken lines (curiosity/questions), not inner monologue. Without an API key, the pet is silent (no local fallback pool).
- **SpeechBubble must NOT be inside the pet wrapper div** — wrapper is only `petSize` px wide, causes shrink-to-fit (vertical text bug).
- **`commands.rs` `log_dir_path()`** only handles `APPDATA` (Windows) — log path fails on Linux/macOS.
- **Test setup**: `src/test-setup.ts` provides canvas stub (legacy; jsdom lacks `getContext("2d")`). PetView now renders SVG, not canvas.
- **Rendering**: sticker SVG rigs (petArt/) animated by a RAF driver (animations/driver.ts) writing `transform` attributes per `<g data-part>`. No spritesheet/canvas. Flip horizontally via a static wrapper `translate(vbW 0) scale(-1 1)`.
- **White sticker border**: each pet part group carries an SVG `<filter>` (feMorphology dilate + white flood) using a `useId()`-derived unique id — never hardcode filter ids, or duplicate-pet instances (settings chips) collide.
- **Hover toolbar is the primary interaction**: appears on `mouseenter` over the pet wrapper; right-click menu is a backup. Quiet mode (`useBehavior.setActive(false)`) stops the brain/local-timer via existing `start()`/`stop()`.
- **Window**: transparent, undecorated, always-on-top, skip-taskbar, `focus: false`, `shadow: false`.
- **Store**: `settings.json` via `@tauri-apps/plugin-store`. Config key is `"config"`. `config.ts` has in-memory fallback.
- **Walk**: `walkController.ts` uses RAF loop with generation counter to prevent stale callbacks. Window position stored as logical pixels; physical→logical via `scaleFactor`.
