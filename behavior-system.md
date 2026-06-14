# KeyPal 行为系统开发指南

## 概述

KeyPal 是一个 Tauri v2 AI 桌面宠物。核心设计理念：**AI 是宠物的大脑，行为系统是宠物的身体**。

AI 负责决定宠物"做什么"——从可用行为中选择一个。行为系统负责把选择翻译成画面——动画帧、窗口移动、气泡渲染、能量变化。

行为系统的三个层次：

- **原子层**（actions + emotions）：可复用的积木块——每个 action 自带 draw 函数，每个 emotion 自带数据
- **行为层**（behaviors）：把原子组装成可执行的 Behavior——包含动画、能量、执行逻辑、持续时间
- **插件层**（plugins）：把相关 behaviors + emotions + speechPool 组装成功能集

---

## 架构总览

```
┌──────────────────────────────────────────────────────────────────┐
│                        BrainEngine                                │
│                                                                   │
│  Timer (5s) ──► tick()                                            │
│                   │                                               │
│                   ├─ buildBasePrompt() + registry.buildSystemPrompt()│
│                   │   列出所有可用行为，告诉 AI 怎么选              │
│                   │                                               │
│                   ├─ AI API 调用 → { thought, behaviorId, params } │
│                   │                                               │
│                   └─ registry.createBehavior(id, params)          │
│                      → executor.enqueue(behavior)                 │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│                     SpeechScheduler                               │
│                                                                   │
│  独立定时器，每 3-5 tick 从 speechPool 随机取一句                  │
│  → executor.enqueueOverlay(createSpeak(text))                    │
│  （不经过 AI，纯本地调度）                                         │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│                    BehaviorExecutor                               │
│                                                                   │
│  主队列 (main):    walk → jump → sleep → ...                      │
│                    一次一个 behavior，新的可打断旧的               │
│                    behavior 结束 → animation 回 idle              │
│                                                                   │
│  叠加层 (overlay): speak                                          │
│                    独立于主队列，只管 speech 状态                  │
│                    新 overlay 替换旧 overlay                      │
│                    overlay 结束 → speech 清除                     │
│                                                                   │
│  状态输出: { animation, energy, speech, flipX }                  │
│  → onStateChange → useBehavior setState → React 重渲染            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 核心概念

### Behavior — 行为

行为是系统中最小的可执行单位。每个行为自包含：它知道自己的动画、能量、持续时间和执行逻辑。

```typescript
interface Behavior {
  id: string;
  interruptible: boolean;
  start(ctx: BehaviorExecContext): Promise<void>;  // resolve = 自然结束
  stop?(): void;                                     // 被打断时清理
}
```

**关键设计：纯推模型。** Behavior 没有 `getState()` 方法。它在 `start()` 中通过 `ctx.emitState()` 推送状态变化：

```typescript
start: (ctx) => {
  ctx.emitState?.({ animation: "jump", energy: 0.9 });
  return new Promise<void>(r => setTimeout(r, 1500));
}
```

Executor 在构造时把 `emitState` 注入到 context 中。Behavior 只需用 `ctx.emitState()`，不需要知道 executor 的存在。

### BehaviorExecContext — 执行上下文

```typescript
interface BehaviorExecContext {
  position: { x: number; y: number };
  screenWidth: number;
  screenHeight: number;
  moveTo?: (x: number, y: number, onDone: () => void) => void;
  emitState?: (partial: BehaviorState) => void;  // 由 executor 注入
}
```

- `moveTo` — 用于 walk 行为，调用后开始移动窗口，到达目标后调 `onDone`
- `emitState` — 推送状态变化（animation/energy/speech/flipX）

### BehaviorState — 行为状态

```typescript
interface BehaviorState {
  animation?: string;      // 动画名（对应 AnimationRegistration.name）
  energy?: number;         // 0.0-1.0，影响动画速度
  speech?: string | null;  // 气泡文字，null = 无气泡
  flipX?: boolean;         // 精灵水平翻转（朝左/朝右）
}
```

这 4 个字段直接驱动渲染：
- `animation` → Pet.tsx 选择精灵图帧序列
- `energy` → Pet.tsx 调节播放速度
- `flipX` → Pet.tsx 水平翻转精灵
- `speech` → SpeechBubble.tsx 显示/隐藏气泡

### BehaviorFactory — 行为工厂

注册到 PluginRegistry 的行为定义。包含动画数据和创建逻辑：

```typescript
interface BehaviorFactory {
  id: string;                    // 行为 ID，同时作为动画名
  animation?: {                  // 视觉数据，registry 自动提取为 AnimationRegistration
    frameCount: number;
    tint?: string;
    draw: AnimationRegistration["draw"];
  };
  requiresParams?: string;       // 人类可读的参数描述（出现在 AI prompt 中）
  create(params?: Record<string, unknown>): Behavior;
}
```

### PetPlugin — 插件

插件是行为的组装者。把相关的 behaviors、emotions、speechPool 组合成一个功能集：

```typescript
interface PetPlugin {
  id: string;
  behaviors?: BehaviorFactory[];
  emotions?: EmotionRegistration[];
  speechPool?: string[];
  augmentSystemPrompt?: (base: string) => string;
}
```

只有 4 个字段，没有生命周期钩子，没有依赖声明，没有决策拦截。

### AIDecision — AI 返回格式

```typescript
interface AIDecision {
  thought: string;               // 内心想法，10-20 字中文
  behaviorId: string;            // 选择的行为 ID
  params?: Record<string, unknown>;  // 行为参数（如 walk 的 targetX/targetY）
}
```

AI **不返回**情绪和台词——情绪和台词由行为自带，AI 只负责选行为。

**AI 返回示例：**

```json
{
  "thought": "想去那边看看闪闪的东西",
  "behaviorId": "walk",
  "params": { "targetX": 1344, "targetY": 648 }
}
```

---

## 行为组合

### compose() — 并发组合

多个行为同时执行，状态合并。适合"边走边说话"这类并行场景。

```typescript
import { compose } from "../behaviors/composite";

const walkAndSpeak = compose(
  walkFactory.create({ targetX: 500, targetY: 300 }),
  createSpeak("去那边看看~"),
);
// getState 合并：{ animation: "walk", energy: 0.7, speech: "去那边看看~" }
// start 并发：Promise.all，所有子行为结束才结束
// 子行为结束时，其状态贡献自动移除
```

compose 内部使用**快照合并**机制：每个子行为拿到包装过的 childCtx，各自维护状态快照。任何子行为推送状态时，compose 重新合并所有活跃子行为的快照，向上推送合并结果。

### sequence() — 顺序组合

多个行为依次执行，前一个完成才开始下一个。适合"走过去然后睡觉"这类流程场景。

```typescript
import { sequence } from "../behaviors/sequence";

const strollAndSnore = sequence(
  walkFactory.create({ targetX: 200, targetY: 500 }),  // 向左走
  walkFactory.create({ targetX: 800, targetY: 500 }),  // 往回走
  snoreFactory.create(),                                // 打呼噜
);
// 子行为通过同一个 ctx 自动推送状态
// 画面自然从 walk 切换到 snore
```

sequence 把同一个 ctx 传给每个子行为。子行为调用 `ctx.emitState()` 时，状态变化自然反映到画面上。

### 两者可以嵌套

```typescript
sequence(
  walkFactory.create({ targetX: 200, targetY: 500 }),
  compose(
    spinFactory.create(),
    createSpeak("转一圈！"),
  ),
  sleepFactory.create(),
);
```

---

## 插件系统

### PluginRegistry

`PluginRegistry`（`src/lib/plugins/registry.ts`）是注册中心。

注册时会：
1. **检查 ID 唯一性** — 重复插件 ID 抛异常
2. **检查 behavior ID 唯一性** — 重复抛异常
3. **自动提取动画** — 从 `factory.animation` 创建 `AnimationRegistration`，存入 animations Map
4. **注册情绪** — 存入 emotions Map
5. **收集 speechPool** — 所有插件的 speechPool 合并为一个数组

```typescript
registry.register(plugin);
registry.createBehavior("walk", { targetX: 500, targetY: 300 });  // 创建 behavior 实例
registry.getAllBehaviors();   // 所有 BehaviorFactory[]
registry.getAllAnimations();  // 所有 AnimationRegistration[]（供 Pet.tsx 渲染）
registry.getSpeechPool();     // 合并后的台词池（供 SpeechScheduler 使用）
registry.buildSystemPrompt(); // 链式拼接所有插件的 prompt 增强
```

### 内置插件

3 个内置插件在 `src/lib/plugins/builtin/` 目录下。

#### base（基础）

**文件**：`base.ts`

注册 5 个基础情绪和通用台词池：

| 情绪 | 色调 | 默认能量 |
|---|---|---|
| IDLE | transparent | 0.5 |
| HAPPY | #fff7a8 | 0.9 |
| FOCUSED | #a8d8ff | 0.7 |
| ANXIOUS | #ffb3b3 | 0.85 |
| SLEEPY | #c9c9e0 | 0.2 |

通用台词："嗯...在想什么呢"、"今天天气不错呀"、"好无聊啊..."等。

#### locomotion（移动）

**文件**：`locomotion.ts`

| 行为 | 时长 | 可打断 | 参数 |
|---|---|---|---|
| idle | 3s | 是 | 无 |
| walk | 到达目标 | 是 | targetX, targetY |
| jump | 1.5s | 是 | 无 |
| spin | 2s | 是 | 无 |

#### rest（休息）

**文件**：`rest.ts`

| 行为 | 时长 | 可打断 | 能量 |
|---|---|---|---|
| yawn | 2.5s | 是 | 0.3 |
| sleep | 5s | 否 | 0.2 |
| snore | 6s | 否 | 0.1 |

休息台词："好困啊..."、"让我再睡一会儿..."、"呼噜噜..."、"zzz..."等。

### 注册顺序

`src/lib/plugins/index.ts`：

```typescript
registry.register(basePlugin);        // 1. 基础情绪 + 通用台词
registry.register(locomotionPlugin);  // 2. 移动行为
registry.register(restPlugin);        // 3. 休息行为
```

无依赖。顺序只影响 prompt 拼接顺序和精灵图帧排列顺序。

---

## 实战：添加新行为

以打呼噜（snore）为例，展示完整的添加流程。

### 第 1 步：创建 action 定义

`src/lib/actions/snore.ts` — draw 函数 + ActionDefinition：

```typescript
import { PetKind } from "../types";
import { ActionDefinition, PetPalette } from "../plugins/types";
import { drawBody, drawEars, SPRITE_FRAME_WIDTH, SPRITE_FRAME_HEIGHT } from "../spriteGenerator";

function drawSnoreFrame(ctx, frameIndex, pet, frameInAnim, palette) {
  const baseX = frameIndex * SPRITE_FRAME_WIDTH;
  const cx = baseX + SPRITE_FRAME_WIDTH / 2;
  const breath = frameInAnim === 1 ? -1 : frameInAnim === 3 ? 1 : 0;
  const cy = SPRITE_FRAME_HEIGHT / 2 + 4 + breath;

  drawBody(ctx, cx, cy, 10, palette);
  drawEars(ctx, cx, cy - 5, 5, 4, palette, pet);

  // 闭眼
  ctx.fillStyle = palette.dark;
  ctx.fillRect(cx - 5, cy - 1, 3, 1);
  ctx.fillRect(cx + 2, cy - 1, 3, 1);
  // 毯子
  ctx.fillRect(cx - 4, cy + 8, 8, 3);

  // Z 字浮动
  ctx.fillStyle = palette.accent;
  if (frameInAnim === 1) ctx.fillRect(cx + 6, cy - 3, 2, 2);
  else if (frameInAnim === 2) ctx.fillRect(cx + 7, cy - 5, 3, 2);
  else if (frameInAnim === 3) ctx.fillRect(cx + 8, cy - 7, 3, 3);
}

export const snoreDefinition: ActionDefinition = {
  type: "snore",
  duration: 6000,
  interruptible: false,
  frameCount: 4,
  tint: "#b0b0d0",
  draw: drawSnoreFrame,
};
```

### 第 2 步：创建 behavior 工厂

`src/lib/behaviors/snore.ts` — BehaviorFactory 包装 action：

```typescript
import { snoreDefinition } from "../actions/snore";
import { BehaviorFactory } from "../plugins/types";

export const snoreFactory: BehaviorFactory = {
  id: "snore",
  animation: {
    frameCount: snoreDefinition.frameCount,
    tint: snoreDefinition.tint,
    draw: snoreDefinition.draw,
  },
  create() {
    return {
      id: "snore",
      interruptible: false,
      start: (ctx) => {
        ctx.emitState?.({ animation: "snore", energy: 0.1 });
        return new Promise<void>((r) => setTimeout(r, 6000));
      },
    };
  },
};
```

### 第 3 步：注册到插件

编辑 `src/lib/plugins/builtin/rest.ts`：

```typescript
import { snoreFactory } from "../../behaviors/snore";

export const restPlugin: PetPlugin = {
  id: "rest",
  behaviors: [yawnFactory, sleepFactory, snoreFactory],  // ← 加一行
  speechPool: ["好困啊...", "呼噜噜...", "zzz..."],        // ← 加台词
  augmentSystemPrompt(base) {
    return base + `\n## 休息行为\n- snore: 打呼噜（6秒，不可打断）\n...`;
  },
};
```

### 完成

引擎、执行器、调度器、AI client、useBehavior — **零改动**。

---

## 精灵系统

### 工作流程

1. `createRegistry()` 注册所有插件
2. 注册时从每个 `BehaviorFactory.animation` 自动提取 `AnimationRegistration`
3. `registry.getAllAnimations()` 获取所有动画定义
4. `generateSpriteSheet(pet, animations)` 动态生成 spritesheet
5. `Pet.tsx` 根据 `currentAnimation` 名查找帧范围，渲染对应帧

### 帧布局

```
spritesheet (32px per frame):
┌──────┬──────┬──────┬──────┬──────┬──────┐
│ idle │ idle │ idle │ idle │ walk │ walk │ ...
│  f0  │  f1  │  f2  │  f3  │  f0  │  f1  │
└──────┴──────┴──────┴──────┴──────┴──────┘
```

帧排列顺序 = behavior 注册顺序 = 插件注册顺序。

### 绘制原语

`spriteGenerator.ts` 导出公共绘制函数：

| 原语 | 用途 |
|---|---|
| `drawBody(ctx, cx, cy, r, palette)` | 画身体圆 + accent 腹部 |
| `drawEars(ctx, cx, cy, off, h, palette, pet)` | 根据 pet 类型画耳朵（cat/dog/frog/chick） |
| `PET_PALETTE` | 每种宠物的三色调 |
| `SPRITE_FRAME_WIDTH / HEIGHT` | 常量 32 |

action 的 draw 函数调用这些原语来绘制每一帧。

### 宠物配色

```typescript
cat:   { body: "#f4a261", accent: "#e76f51", dark: "#6b4423" }
dog:   { body: "#c89b6d", accent: "#8b5a2b", dark: "#3d2817" }
frog:  { body: "#6aa84f", accent: "#38761d", dark: "#274e13" }
chick: { body: "#ffd966", accent: "#f1c232", dark: "#7f6000" }
```

---

## 本地降级模式

当用户没有配置 API Key 时，`useBehavior` 使用本地随机模式：

- 从 `registry.getAllBehaviors()` 中随机选一个（排除 idle）
- walk 时随机生成屏幕坐标
- 不调用 AI
- SpeechScheduler 仍然独立运行，宠物会随机说话
- 间隔与 AI 模式相同（默认 5 秒）

---

## 文件索引

| 文件 | 职责 |
|---|---|
| **行为层** | |
| `src/lib/behaviors/types.ts` | Behavior, BehaviorState, BehaviorExecContext 接口 |
| `src/lib/behaviors/composite.ts` | compose() — 并发组合 |
| `src/lib/behaviors/sequence.ts` | sequence() — 顺序组合 |
| `src/lib/behaviors/idle.ts` | idle 行为工厂 |
| `src/lib/behaviors/walk.ts` | walk 行为工厂（需要 targetX/targetY） |
| `src/lib/behaviors/jump.ts` | jump 行为工厂 |
| `src/lib/behaviors/spin.ts` | spin 行为工厂 |
| `src/lib/behaviors/yawn.ts` | yawn 行为工厂 |
| `src/lib/behaviors/sleep.ts` | sleep 行为工厂 |
| `src/lib/behaviors/snore.ts` | snore 行为工厂 |
| `src/lib/behaviors/speak.ts` | speak 行为工厂 + createSpeak() |
| **动画原子层** | |
| `src/lib/actions/*.ts` | draw 函数 + ActionDefinition（每个文件一个动作） |
| `src/lib/emotions/index.ts` | 5 个情绪定义 |
| **引擎层** | |
| `src/lib/behaviorExecutor.ts` | 双轨队列执行器（main + overlay） |
| `src/lib/speechScheduler.ts` | 独白调度器（每 3-5 tick） |
| `src/lib/brainEngine.ts` | AI 大脑：定时决策 + prompt 构建 |
| `src/lib/aiClient.ts` | OpenAI 兼容 API 调用（20s 超时） |
| **插件层** | |
| `src/lib/plugins/types.ts` | PetPlugin, BehaviorFactory, AIDecision 等接口 |
| `src/lib/plugins/registry.ts` | PluginRegistry 实现 |
| `src/lib/plugins/index.ts` | createRegistry() — 注册内置插件 |
| `src/lib/plugins/builtin/base.ts` | 基础情绪 + 通用台词 |
| `src/lib/plugins/builtin/locomotion.ts` | idle/walk/jump/spin 行为 |
| `src/lib/plugins/builtin/rest.ts` | yawn/sleep/snore 行为 |
| **渲染层** | |
| `src/lib/spriteGenerator.ts` | drawBody/drawEars 原语 + generateSpriteSheet |
| `src/lib/spritesheet.ts` | 动画帧控制器 |
| `src/lib/walkController.ts` | 平滑窗口移动（RAF + generation counter） |
| `src/hooks/useBehavior.ts` | 连接 Executor + BrainEngine 到 React |
| `src/components/Pet.tsx` | canvas 精灵渲染 |
| `src/components/SpeechBubble.tsx` | 台词气泡 |
