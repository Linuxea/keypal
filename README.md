# KeyPal

AI-powered desktop pet built with Tauri v2. A **sticker-style SVG pet** roams freely on your screen, driven autonomously by AI (DeepSeek or any OpenAI-compatible API). Plugin-based extensibility lets you add custom behaviors, animations, and AI rules.

## Features

- **4 sticker pets**: 小咪(cat)、大黄(floppy dog)、呱呱(frog)、叽叽(chick) — each an SVG rig of named body parts (body / head / ears / eyes / tail / legs) with a bold-outline, white die-cut, saturated-fill look
- **7 behaviors × smooth transform animation**: idle / walk / jump / spin / yawn / sleep / snore — driven by a lightweight RAF animation driver that interpolates per-part transforms (breathing, blink, tail wag, hop, spin), not frame-by-frame redraws
- **AI-driven autonomy**: pet decides what to do every N seconds via DeepSeek / OpenAI-compatible API
- **Local fallback**: random behaviors when no API key is configured — works offline
- **Plugin system**: register custom behaviors, emotions, and inject AI prompt rules
- **Transparent window**: undecorated, always-on-top, draggable, skips taskbar
- **Hover toolbar**: hover the pet → a row of round sticker buttons (switch pet / settings / quiet mode / quit); right-click also works as a backup
- **Settings panel**: sticker-card UI to configure pet, size, AI endpoint, model, interval
- **Speech bubbles**: AI-generated dialogue floating above the pet, tinted to the pet's color
- **77 tests**: Vitest + Testing Library

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5.8, Vite 7 |
| Backend | Rust (Tauri 2) |
| Plugins | tauri-plugin-opener, tauri-plugin-store |
| Testing | Vitest, @testing-library/react, jsdom |

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (18+)
- [Rust](https://www.rust-lang.org/tools/install)
- System dependencies for [Tauri 2](https://v2.tauri.app/start/prerequisites/)

### Install & Run

```bash
npm install
npm run tauri dev
```

### Build

```bash
npm run tauri build
```

### Test

```bash
npm test
```

## Usage

### Interacting with the pet

- **Hover** the pet → a sticker **toolbar** pops above it: switch pet / settings / quiet mode / quit
- **Right-click** the pet → backup sticker context menu
- **Drag** the pet to reposition (position persists)

### Settings

| Setting | Options | Default |
|---------|---------|---------|
| Pet | 小咪 / 大黄 / 呱呱 / 叽叽 | 小咪 (cat) |
| Size | 64px, 96px, 128px | 96px |
| AI Base URL | any OpenAI-compatible endpoint | `https://api.deepseek.com` |
| API Key | your API key | (empty = local mode) |
| Model | model name | `deepseek-chat` |
| Interval | 5s, 10s, 30s | 5s |

### AI Configuration

KeyPal sends decision requests to `{baseUrl}/v1/chat/completions`. Any OpenAI-compatible API works — DeepSeek, OpenAI, local models via Ollama, etc. When no API key is set, the pet uses local random behavior with no AI calls.

## Architecture

```
App
├── SpeechBubble        (floating above pet, tinted to pet color)
├── HoverToolbar        (round sticker buttons on hover: pet/settings/quiet/quit)
├── PetView (svg)       (sticker pet rig + RAF animation driver)
├── ContextMenu         (right-click backup)
└── SettingsPanel       (sticker-card modal)
```

### AI Decision Pipeline

```
Timer (5s default)
  → buildBasePrompt()        (pet personality + behavioral rules)
  → registry.buildSystemPrompt()  (plugin-injected rules)
  → AI API call                   (OpenAI-compatible /v1/chat/completions)
  → executor.enqueue(behavior)    (behavior → emitState {animation, energy, flipX})
```

AI returns JSON: `{ thought, behaviorId, params? }` — `thought` is the visible speech-bubble text.

### Rendering pipeline (new)

```
behavior state { animation, energy, flipX }
  → PetView picks PetArt (cat/dog/frog/chick)
  → AnimationDriver reads ANIMATIONS[animation] (declarative per-part keyframes)
  → each RAF frame: interpolate keyframes → write `transform` attr on each <g data-part>
  → SVG parts move (ears wiggle, body breathes, eyes blink, jump hops via __root__)
```

The behavior engine, executor, AI client, walk controller, plugins, and Tauri backend are **unchanged by rendering** — they only push `{ animation, energy, flipX }` state, which PetView consumes.

## Plugin System

Plugins register behaviors and augment the AI prompt.

| Hook | Purpose |
|------|---------|
| `augmentSystemPrompt` | Inject rules into the AI prompt |
| `behaviors` | Register executable behavior factories (each emits an animation id) |
| `emotions` | Register emotion metadata |

Built-in plugins: `base` (emotions), `locomotion` (idle/walk/jump/spin), `rest` (yawn/sleep/snore).

## Project Structure

```
src/
  main.tsx                 React entry
  App.tsx                  Root: config state, window resize, menus, behavior
  components/
    PetView.tsx            SVG pet rig + animation driver (replaces old canvas)
    HoverToolbar.tsx       On-hover round sticker buttons
    ContextMenu.tsx        Right-click sticker menu (backup)
    SettingsPanel.tsx      Sticker-card settings modal
    SpeechBubble.tsx       Tinted speech bubble
  hooks/
    useBehavior.ts         BrainEngine → React state (+ setActive for quiet mode)
    useDrag.ts             Tauri startDragging + position persistence
  lib/
    types.ts               AppConfig, PetKind, window constants
    config.ts              Tauri store wrapper (settings.json)
    aiClient.ts            OpenAI-compatible API client
    brainEngine.ts         Timer → AI decision → plugin pipeline
    behaviorExecutor.ts    Dual-track queue executor (main + overlay)
    walkController.ts      Smooth window movement via RAF
    log.ts                 Logging via Tauri append_log
    petArt/                Sticker SVG rigs per pet (cat/dog/frog/chick)
    animations/            Declarative animation registry + RAF driver
    behaviors/             Behavior factories (one per behavior) + compose/sequence
    plugins/               Plugin registry + builtins (base/locomotion/rest)
    ui/tokens.ts           Sticker design tokens (colors, shadows)
src-tauri/
  src/
    main.rs                Entry point
    lib.rs                 Tauri builder, window setup
    commands.rs            Tauri commands (exit, save_position, log)
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server (port 1420) |
| `npm run build` | TypeScript check + Vite build |
| `npm run tauri dev` | Tauri dev (auto-starts Vite) |
| `npm run tauri build` | Tauri production build |
| `npm test` | Run all tests |
| `npm run test:watch` | Tests in watch mode |

## License

MIT
