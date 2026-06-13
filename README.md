# KeyPal

AI-powered desktop pet built with Tauri v2. A pixel-art sprite roams freely on your screen, driven autonomously by AI (DeepSeek or any OpenAI-compatible API). Plugin-based extensibility lets you add custom actions, emotions, animations, and AI rules.

## Features

- **4 pets**: cat, dog, frog, chick — each with unique pixel-art palettes
- **5 emotions × 6 actions**: IDLE, HAPPY, FOCUSED, ANXIOUS, SLEEPY → idle, walk, jump, spin, yawn, sleep
- **AI-driven autonomy**: pet decides what to do every N seconds via DeepSeek / OpenAI-compatible API
- **Local fallback**: random actions when no API key is configured — works offline
- **Plugin system**: register custom animations, actions, emotions, intercept AI decisions, inject prompt rules
- **Transparent window**: undecorated, always-on-top, draggable, skips taskbar
- **Right-click menu**: switch pet, open settings, quit
- **Settings panel**: configure pet type, size, AI endpoint, model, interval
- **Speech bubbles**: AI-generated dialogue floating above the pet
- **84 tests**: Vitest + Testing Library

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

### Right-Click Menu

Right-click the pet to:
- **Switch Pet** — cat, dog, frog, or chick
- **Settings** — open the configuration panel
- **Quit** — exit KeyPal

### Settings

| Setting | Options | Default |
|---------|---------|---------|
| Pet | cat, dog, frog, chick | cat |
| Size | 64px, 96px, 128px | 96px |
| AI Base URL | any OpenAI-compatible endpoint | `https://api.deepseek.com` |
| API Key | your API key | (empty = local mode) |
| Model | model name | `deepseek-chat` |
| Interval | 5s, 10s, 30s | 5s |

### AI Configuration

KeyPal sends decisions requests to `{baseUrl}/v1/chat/completions`. Any OpenAI-compatible API works — DeepSeek, OpenAI, local models via Ollama, etc.

When no API key is set, the pet uses local random behavior (walk, jump, spin, yawn) with no AI calls.

## Architecture

```
App
├── SpeechBubble        (floating above pet, full-width flex container)
├── Pet (canvas)        (pixel-art sprite, RAF animation loop)
├── ContextMenu         (right-click: switch pet, settings, quit)
└── SettingsPanel       (modal: pet/size/AI config)
```

### AI Decision Pipeline

```
Timer (5s default)
  → buildBasePrompt()        (pet personality + behavioral rules)
  → registry.buildSystemPrompt()  (plugin-injected rules)
  → registry.buildContext()       (plugin-injected context data)
  → AI API call                   (OpenAI-compatible /v1/chat/completions)
  → registry.executeDecision()    (plugin chain → action execution)
```

AI returns JSON: `{ thought, emotion: { primary, energy, mood }, action: { type, params?, description }, speech }`

### Data Flow

```
useBehavior(aiConfig)
  ├── PluginRegistry (emotion-core → action-core → speech-core)
  ├── BrainEngine (timer → AI → plugin pipeline → React state)
  ├── WalkController (RAF-based smooth window movement)
  └── Local fallback (random actions when no API key)
```

## Plugin System

KeyPal's plugin system is the core extensibility mechanism. Plugins hook into 5 pipeline stages:

| Hook | Purpose |
|------|---------|
| `augmentSystemPrompt` | Inject rules into the AI prompt |
| `augmentContext` | Add data to the AI request context |
| `onDecision` | Intercept, modify, or block AI decisions |
| `animations` | Register canvas draw functions for new animations |
| `actions` + `emotions` | Register executable action types and emotion dimensions |

Built-in plugins: `emotion-core` (5 emotions), `action-core` (6 actions), `speech-core` (dialogue rules).

For a complete guide with examples, see **[plugin-system.md](./plugin-system.md)**.

## Project Structure

```
src/
  main.tsx                 React entry
  App.tsx                  Root: config state, window resize, menus, behavior
  components/
    Pet.tsx                Canvas sprite animation (RAF loop)
    ContextMenu.tsx        Right-click menu
    SettingsPanel.tsx      Settings modal
    SpeechBubble.tsx       Floating speech bubble
  hooks/
    useBehavior.ts         BrainEngine → React state
    useDrag.ts             Tauri startDragging + position persistence
  lib/
    types.ts               AppConfig, PetKind, MoodState, sprite constants
    config.ts              Tauri store wrapper (settings.json)
    aiClient.ts            OpenAI-compatible API client
    brainEngine.ts         Timer → AI decision → plugin pipeline
    walkController.ts      Smooth window movement via RAF
    spriteGenerator.ts     Dynamic spritesheet from plugin animations
    spritesheet.ts         Animation frame controller (FPS × energy)
    log.ts                 Logging via Tauri append_log
    plugins/
      types.ts             PetPlugin, AIDecision, etc.
      registry.ts          PluginRegistry
      index.ts             createRegistry() — loads builtins
      builtin/
        emotionPlugin.ts   5 emotions
        actionPlugin.ts    6 actions
        speechPlugin.ts    Speech bubble rules
src-tauri/
  src/
    main.rs                Entry point
    lib.rs                 Tauri builder, window setup
    commands.rs            Tauri commands (exit, save_position, log)
  capabilities/
    default.json           Permissions
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
