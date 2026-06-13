# KeyPal 插件系统开发指南

## 概述

KeyPal 的插件系统是整个应用的核心架构。设计理念：**AI 是宠物的大脑，插件是宠物的身体**。

AI（DeepSeek 或任意 OpenAI 兼容 API）负责决定宠物"想做什么"——走动、蹦跳、说话、情绪变化。插件负责把这些抽象决策翻译成实际可执行的东西——动画帧、窗口移动、气泡渲染。

每个插件是一个独立的能力模块，可以随时加载/卸载。你可以通过编写插件来：

- 添加新动作（跳舞、追逐鼠标、翻跟头）
- 添加新情绪（好奇、兴奋、害怕）
- 修改 AI 性格（让宠物变傲娇、变话痨）
- 注入外部数据（天气、时间、系统事件）
- 拦截/修改 AI 决策（安全限制、行为过滤）

---

## 架构总览

```
┌─────────────────────────────────────────────────────────┐
│                    BrainEngine                           │
│                                                         │
│  Timer (5s) ──► tick()                                  │
│                   │                                     │
│                   ├─ 1. buildBasePrompt()               │  基础人格 prompt
│                   │    (性格、行为规则、坐标示例)         │
│                   │                                     │
│                   ├─ 2. registry.buildSystemPrompt()    │  插件链式增强
│                   │    emotionPlugin ──► actionPlugin   │  每个插件往
│                   │    ──► speechPlugin ──► 你的插件     │  prompt 里加规则
│                   │                                     │
│                   ├─ 3. registry.buildContext()         │  插件链式增强
│                   │    每个 plugin.augmentContext()      │  往上下文加数据
│                   │                                     │
│                   ├─ 4. AI API 调用                     │  发给 DeepSeek/GPT
│                   │    system: basePrompt + pluginPrompt │
│                   │    user: JSON.stringify(context)    │
│                   │                                     │
│                   └─ 5. AI 返回 AIDecision JSON          │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                   PluginRegistry                         │
│                                                         │
│  executeDecision(decision)                              │
│    │                                                    │
│    ├─ plugin1.onDecision(decision)  ──► 修改或拦截       │
│    ├─ plugin2.onDecision(decision)  ──► 修改或拦截       │
│    ├─ plugin3.onDecision(decision)  ──► 修改或拦截       │
│    │                                                    │
│    └─ action.execute(ctx)                               │  执行副作用
│       (如 walkController 移动窗口)                       │
│                                                         │
│  Pet 组件读取 animation 名称 ──► 渲染对应精灵帧           │
│  SpeechBubble 读取 speech 字段 ──► 显示气泡              │
└─────────────────────────────────────────────────────────┘
```

---

## 核心接口

所有接口定义在 `src/lib/plugins/types.ts`。

### PetPlugin

插件的主接口。一个插件就是实现了这个接口的对象。

```typescript
interface PetPlugin {
  // ── 元信息 ──
  id: string;                    // 唯一标识，如 "action-dance"
  name: string;                  // 人类可读名称，如 "跳舞动作"
  version: string;               // 语义化版本，如 "1.0.0"
  dependencies?: string[];       // 依赖的其他插件 id

  // ── 生命周期 ──
  onLoad?: (ctx: PluginContext) => Promise<void>;
  onUnload?: () => Promise<void>;

  // ── AI 提示词增强 ──
  augmentSystemPrompt?: (base: string) => string;

  // ── AI 上下文增强 ──
  augmentContext?: (ctx: BehaviorContext) => BehaviorContext;

  // ── 决策拦截 ──
  onDecision?: (decision: AIDecision) => AIDecision | null;

  // ── 能力注册 ──
  animations?: AnimationRegistration[];
  actions?: ActionRegistration[];
  emotions?: EmotionRegistration[];
}
```

### AIDecision

AI 每次决策返回的 JSON 结构。这是整个系统的"通信协议"。

```typescript
interface AIDecision {
  thought: string;               // 内心想法，10-20 字中文
  emotion: {
    primary: string;             // 情绪名，必须匹配已注册的 EmotionRegistration
    energy: number;              // 0.0-1.0，影响动画速度
    mood: string;                // AI 自由描述的情绪细节
  };
  action: {
    type: string;                // 动作类型，必须匹配已注册的 ActionRegistration
    params?: Record<string, unknown>;  // 动作参数，如 { targetX, targetY }
    description: string;         // AI 自由描述的动作细节
  };
  speech: string | null;         // 台词，null 表示不说话
}
```

**AI 返回示例：**

```json
{
  "thought": "想去那边看看闪闪的东西",
  "emotion": { "primary": "HAPPY", "energy": 0.8, "mood": "好奇" },
  "action": {
    "type": "walk",
    "params": { "targetX": 1344, "targetY": 648 },
    "description": "走向右边"
  },
  "speech": "去那边逛逛~"
}
```

### AnimationRegistration

注册一个动画。动画是一组 canvas 绘制帧。

```typescript
interface AnimationRegistration {
  name: string;                  // 动画名，如 "dance"
  frameCount: number;            // 帧数，如 6
  draw: (                        // 帧绘制函数
    ctx: CanvasRenderingContext2D,
    frame: number,               // 当前帧索引（0 到 frameCount-1）
    palette: PetPalette,         // 宠物配色
    frameIndex: number,          // 在 spritesheet 中的全局帧索引
  ) => void;
}
```

### ActionRegistration

注册一个动作。动作 = 动画 + 时长 + 可选的副作用执行函数。

```typescript
interface ActionRegistration {
  type: string;                  // 动作类型，如 "dance"
  animation: string;             // 对应的 AnimationRegistration.name
  duration: number;              // 持续时间（毫秒），0 = 持续直到被打断
  interruptible: boolean;        // 是否可被新动作打断
  execute?: (ctx: ActionContext) => Promise<void>;  // 副作用
}

interface ActionContext {
  targetX?: number;              // 目标 X 坐标（walk 用）
  targetY?: number;              // 目标 Y 坐标（walk 用）
  description: string;           // AI 描述的动作细节
  params?: Record<string, unknown>;  // AI 返回的原始 params
}
```

### EmotionRegistration

注册一个情绪维度。

```typescript
interface EmotionRegistration {
  name: string;                  // 情绪名，如 "CURIOUS"
  tint: string;                  // 精灵背景色调，如 "#a8ffd8"，"transparent" = 无
  defaultEnergy: number;         // 默认能量值 0.0-1.0
}
```

### BehaviorContext

每次 AI 调用时传给 AI 的上下文数据。插件可以通过 `augmentContext` 往里面加数据。

```typescript
interface BehaviorContext {
  currentEmotion: string;        // 当前情绪，如 "HAPPY"
  currentEnergy: number;         // 当前能量值
  lastAction: string | null;     // 上一次动作类型
  lastSpeech: string | null;     // 上一次台词
  position: { x: number; y: number };  // 当前窗口位置
  screenWidth: number;           // 屏幕宽度
  screenHeight: number;          // 屏幕高度
  pet: PetKind;                  // 宠物种类（cat/dog/frog/chick）
  petName: string;               // 宠物名字
  timeSinceLastAction: number;   // 距上次决策的毫秒数
  decisionHistory: string[];     // 最近的 thought 历史（最多 10 条）
}
```

---

## 五个生命周期钩子

### 1. `augmentSystemPrompt` — 注入 AI 规则

**作用**：告诉 AI "你能做什么"。

每个插件的 `augmentSystemPrompt` 接收上一个插件的输出作为输入，链式拼接。最终结果和 `buildBasePrompt()` 合并后发给 AI。

**执行顺序**：按注册顺序。先注册的插件先执行。

```typescript
const myPlugin: PetPlugin = {
  // ...
  augmentSystemPrompt(base: string): string {
    return base + `\n## 跳舞能力
你可以跳舞（dance 动作）。开心或听到音乐时触发。
dance 不需要 params。`;
  },
};
```

### 2. `augmentContext` — 注入上下文数据

**作用**：给 AI 提供决策所需的额外数据。

例如天气插件可以注入当前天气，AI 据此决定行为（下雨天变懒散）。

```typescript
const weatherPlugin: PetPlugin = {
  // ...
  augmentContext(ctx: BehaviorContext): BehaviorContext {
    return {
      ...ctx,
      // BehaviorContext 没有 weather 字段，但 JSON.stringify
      // 会把额外字段一起发给 AI
      ...({ weather: "sunny" } as Record<string, unknown>),
    } as BehaviorContext;
  },
};
```

### 3. `onDecision` — 拦截/修改/阻止决策

**作用**：在 AI 决策返回后、执行前进行拦截。

- 返回修改后的 `AIDecision` → 替换原决策
- 返回 `null` → 阻止本次决策（整个执行链终止）
- 不实现此方法 → 不干预

**执行顺序**：按注册顺序链式执行。每个插件接收前一个插件的输出。

```typescript
const safetyPlugin: PetPlugin = {
  // ...
  onDecision(decision: AIDecision): AIDecision | null {
    // 阻止宠物走到屏幕外
    if (decision.action.type === "walk") {
      const x = decision.action.params?.targetX as number;
      const y = decision.action.params?.targetY as number;
      if (x < 0 || y < 0) {
        return null;  // 拦截
      }
    }
    return decision;  // 放行
  },
};
```

### 4. `animations` — 注册动画帧

**作用**：告诉系统"我能画这些动画"。

注册后，`spriteGenerator.ts` 会把所有插件的动画动态合成为一个 spritesheet。`Pet` 组件根据动画名查找对应的帧范围进行渲染。

```typescript
const dancePlugin: PetPlugin = {
  // ...
  animations: [
    {
      name: "dance",
      frameCount: 6,
      draw: (ctx, frame, palette, frameIndex) => {
        const x = frameIndex * 32;  // 每帧 32px 宽
        const cx = x + 16;
        const cy = 16;

        // 画身体
        ctx.fillStyle = palette.body;
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.fill();

        // 根据帧索引画不同姿势
        const sway = Math.sin((frame / 6) * Math.PI * 2) * 3;
        ctx.fillStyle = palette.accent;
        ctx.fillRect(cx - 5 + sway, cy + 5, 3, 4);
        ctx.fillRect(cx + 2 - sway, cy + 5, 3, 4);
      },
    },
  ],
};
```

> **注意**：如果插件的 `draw` 函数未提供（为空函数），`spriteGenerator` 会使用内置的绘制函数。内置绘制函数按动画名匹配（idle/walk/jump/spin/yawn/sleep）。对于自定义动画名，请务必提供 `draw` 函数。

### 5. `actions` + `emotions` — 注册动作和情绪

**作用**：告诉系统"我能执行这些动作"和"我认识这些情绪"。

```typescript
actions: [
  {
    type: "dance",
    animation: "dance",        // 对应上面注册的动画
    duration: 3000,            // 3 秒
    interruptible: true,       // 可被打断
    execute: async (ctx) => {
      // 可选副作用：比如播放音效、触发特效
      console.log("跳舞中！", ctx.description);
    },
  },
],

emotions: [
  {
    name: "CURIOUS",
    tint: "#a8ffd8",
    defaultEnergy: 0.75,
  },
],
```

---

## 注册表机制

`PluginRegistry`（`src/lib/plugins/registry.ts`）是插件系统的中枢。

### 注册

```typescript
registry.register(plugin);
```

注册时会：
1. **检查 ID 唯一性** — 重复 ID 抛异常
2. **检查依赖** — `dependencies` 中列出的插件必须已注册
3. **检查命名冲突** — animation/action/emotion 名称不能重复
4. **注册能力** — 把 animations/actions/emotions 分别存入 Map

### 卸载

```typescript
registry.unregister("action-dance");
```

卸载时会移除该插件注册的所有 animation/action/emotion。

### buildSystemPrompt

```typescript
const prompt = registry.buildSystemPrompt();
```

遍历所有插件，链式调用 `augmentSystemPrompt`。前一个插件的输出是后一个的输入。

### buildContext

```typescript
const ctx = registry.buildContext(baseContext);
```

遍历所有插件，链式调用 `augmentContext`。

### executeDecision

```typescript
await registry.executeDecision(decision);
```

1. 遍历所有插件的 `onDecision`，链式处理
2. 如果某个插件返回 `null`，终止执行
3. 查找 `decision.action.type` 对应的 `ActionRegistration`
4. 如果 action 有 `execute` 函数，调用它

---

## 内置插件

KeyPal 自带三个内置插件，在 `src/lib/plugins/builtin/` 目录下。

### emotion-core（情绪核心）

**文件**：`emotionPlugin.ts`
**依赖**：无
**注册内容**：

| 情绪 | 色调 | 默认能量 |
|---|---|---|
| IDLE | transparent | 0.5 |
| HAPPY | #fff7a8 | 0.9 |
| FOCUSED | #a8d8ff | 0.7 |
| ANXIOUS | #ffb3b3 | 0.85 |
| SLEEPY | #c9c9e0 | 0.2 |

**prompt 注入**：告诉 AI 有哪些情绪可用，每种情绪的含义和能量值。

### action-core（动作核心）

**文件**：`actionPlugin.ts`
**依赖**：`emotion-core`（必须先注册情绪核心）
**注册内容**：

| 动作 | 动画 | 时长 | 可打断 |
|---|---|---|---|
| idle | idle | 3000ms | 是 |
| walk | walk | 0（持续） | 是 |
| jump | jump | 1500ms | 是 |
| spin | spin | 2000ms | 是 |
| yawn | yawn | 2500ms | 是 |
| sleep | sleep | 5000ms | **否** |

**prompt 注入**：告诉 AI 有哪些动作可用，每个动作的参数要求（walk 需要 targetX/targetY），以及情绪与动作的关联建议。

### speech-core（台词核心）

**文件**：`speechPlugin.ts`
**依赖**：无
**注册内容**：无（只注入 prompt 规则）
**prompt 注入**：告诉 AI 台词规则——20 字以内、符合情绪、每 3-5 轮说一次。

### 加载顺序

内置插件的加载在 `src/lib/plugins/index.ts`：

```typescript
export function createRegistry(): PluginRegistry {
  const registry = new PluginRegistry();
  registry.register(emotionPlugin);   // 1. 先注册情绪
  registry.register(actionPlugin);    // 2. 再注册动作（依赖情绪）
  registry.register(speechPlugin);    // 3. 最后注册台词
  return registry;
}
```

> **重要**：注册顺序决定 prompt 拼接顺序和 decision 拦截顺序。`action-core` 依赖 `emotion-core`，如果反过来注册会抛异常。

---

## 实战：写一个跳舞插件

下面从零开始编写一个完整的"跳舞"插件。

### 第 1 步：创建插件文件

```
src/lib/plugins/builtin/dancePlugin.ts
```

### 第 2 步：编写插件

```typescript
import { PetPlugin } from "../types";

export const dancePlugin: PetPlugin = {
  id: "action-dance",
  name: "跳舞动作",
  version: "1.0.0",
  dependencies: ["emotion-core"],

  // ── 注册动画 ──
  animations: [
    {
      name: "dance",
      frameCount: 6,
      draw: (ctx, frame, palette, frameIndex) => {
        const baseX = frameIndex * 32;
        const cx = baseX + 16;
        const cy = 16;

        // 左右摇摆
        const sway = Math.sin((frame / 6) * Math.PI * 2) * 4;

        // 画身体
        ctx.fillStyle = palette.body;
        ctx.beginPath();
        ctx.arc(cx + sway, cy, 10, 0, Math.PI * 2);
        ctx.fill();

        // 画腹部
        ctx.fillStyle = palette.accent;
        ctx.beginPath();
        ctx.arc(cx + sway, cy + 3, 7, 0, Math.PI * 2);
        ctx.fill();

        // 画耳朵（根据宠物种类不同）
        ctx.fillStyle = palette.body;
        ctx.fillRect(cx - 7 + sway, cy - 9, 3, 4);
        ctx.fillRect(cx + 4 + sway, cy - 9, 3, 4);

        // 画开心的眼睛
        ctx.fillStyle = palette.dark;
        ctx.fillRect(cx - 5 + sway, cy - 1, 2, 2);
        ctx.fillRect(cx + 3 + sway, cy - 1, 2, 2);

        // 画上举的手
        const armUp = frame % 2 === 0 ? 1 : -1;
        ctx.fillRect(cx - 8 + sway, cy - 2 + armUp, 2, 5);
        ctx.fillRect(cx + 6 + sway, cy - 2 - armUp, 2, 5);
      },
    },
  ],

  // ── 注册动作 ──
  actions: [
    {
      type: "dance",
      animation: "dance",
      duration: 4000,
      interruptible: true,
    },
  ],

  // ── 注入 AI prompt ──
  augmentSystemPrompt(base: string): string {
    return (
      base +
      `\n## 跳舞能力
你可以跳舞（dance 动作）。
- dance: 开心地手舞足蹈，4秒，可打断
- 不需要 params
- HAPPY 情绪时优先考虑跳舞
- 听到音乐、看到有趣的东西时可以跳舞`
    );
  },
};
```

### 第 3 步：注册插件

编辑 `src/lib/plugins/index.ts`：

```typescript
import { PluginRegistry } from "./registry";
import { emotionPlugin } from "./builtin/emotionPlugin";
import { actionPlugin } from "./builtin/actionPlugin";
import { speechPlugin } from "./builtin/speechPlugin";
import { dancePlugin } from "./builtin/dancePlugin";    // ← 新增

export function createRegistry(): PluginRegistry {
  const registry = new PluginRegistry();
  registry.register(emotionPlugin);
  registry.register(actionPlugin);
  registry.register(speechPlugin);
  registry.register(dancePlugin);                        // ← 新增
  return registry;
}
```

### 第 4 步：验证

启动应用后，AI 的 system prompt 会自动包含跳舞规则。AI 在 HAPPY 情绪时可能会返回：

```json
{
  "thought": "心情好想跳舞",
  "emotion": { "primary": "HAPPY", "energy": 0.95, "mood": "兴奋" },
  "action": { "type": "dance", "description": "开心地手舞足蹈" },
  "speech": "啦啦啦~跳舞咯！"
}
```

`Pet` 组件会自动播放 dance 动画的 6 帧，`SpeechBubble` 会显示台词。

---

## 精灵系统对接

`spriteGenerator.ts` 负责把所有插件注册的动画合成为一个 spritesheet。

### 工作流程

1. `createRegistry()` 注册所有插件
2. `registry.getAllAnimations()` 获取所有动画定义
3. `generateSpriteSheet(pet, animations)` 动态生成 spritesheet：
   - 计算总帧数 = 所有动画的 frameCount 之和
   - 创建 canvas，宽度 = 总帧数 × 32px
   - 遍历每个动画的每一帧，调用 `animation.draw(ctx, frame, palette, frameIndex)`
4. 结果缓存在内存中（key = pet + 动画名列表）

### 帧布局

```
spritesheet:
┌──────┬──────┬──────┬──────┬──────┬──────┐
│ idle │ idle │ idle │ idle │ walk │ walk │ ...
│  f0  │  f1  │  f2  │  f3  │  f0  │  f1  │
└──────┴──────┴──────┴──────┴──────┴──────┘
  ↑                       ↑
  idle 起始帧=0           walk 起始帧=4
```

`getAnimationFrameRange(animations, "dance")` 返回 `{ start: 20, count: 6 }`，`Pet` 组件据此定位帧。

### 内置绘制函数

`spriteGenerator.ts` 内置了以下动画的绘制逻辑：

| 动画名 | 绘制效果 |
|---|---|
| idle | 原地轻微浮动，眨眼 |
| walk | 身体上下移动，腿部交替 |
| jump | 向上弹跳，开心表情 |
| spin | 水平压缩模拟旋转 |
| yawn | 张嘴打哈欠 |
| sleep | 闭眼，底部画 Z 字 |

对于自定义动画名（如 "dance"），如果 `draw` 函数不是空函数，会使用你提供的绘制逻辑。如果是空函数，会降级为 idle 绘制。

### 宠物配色

每种宠物有固定的三色调（`PET_PALETTE`）：

```typescript
cat:   { body: "#f4a261", accent: "#e76f51", dark: "#6b4423" }
dog:   { body: "#c89b6d", accent: "#8b5a2b", dark: "#3d2817" }
frog:  { body: "#6aa84f", accent: "#38761d", dark: "#274e13" }
chick: { body: "#ffd966", accent: "#f1c232", dark: "#7f6000" }
```

`draw` 函数的 `palette` 参数就是当前宠物的配色，绘制时使用 `palette.body`、`palette.accent`、`palette.dark`。

---

## 测试指南

插件测试使用 Vitest + @testing-library/react。参考 `src/lib/plugins/registry.test.ts` 和 `src/lib/plugins/builtin/*.test.ts`。

### 测试注册

```typescript
import { describe, it, expect } from "vitest";
import { PluginRegistry } from "../registry";
import { dancePlugin } from "./dancePlugin";

describe("dancePlugin", () => {
  it("registers dance animation", () => {
    const registry = new PluginRegistry();
    registry.register({ id: "emotion-core", name: "情绪", version: "1" });  // mock 依赖
    registry.register(dancePlugin);

    const anim = registry.getAnimation("dance");
    expect(anim).toBeDefined();
    expect(anim!.frameCount).toBe(6);
  });

  it("registers dance action", () => {
    const registry = new PluginRegistry();
    registry.register({ id: "emotion-core", name: "情绪", version: "1" });
    registry.register(dancePlugin);

    const action = registry.getAction("dance");
    expect(action).toBeDefined();
    expect(action!.duration).toBe(4000);
    expect(action!.interruptible).toBe(true);
  });

  it("augments system prompt", () => {
    const registry = new PluginRegistry();
    registry.register({ id: "emotion-core", name: "情绪", version: "1" });
    registry.register(dancePlugin);

    const prompt = registry.buildSystemPrompt();
    expect(prompt).toContain("dance");
    expect(prompt).toContain("跳舞");
  });
});
```

### 测试决策拦截

```typescript
it("onDecision can modify decisions", async () => {
  const registry = new PluginRegistry();
  const executeSpy = vi.fn();

  registry.register({
    id: "modifier",
    name: "修改器",
    version: "1",
    onDecision: (d) => ({ ...d, thought: d.thought + "!" }),
    actions: [
      { type: "idle", animation: "idle", duration: 1000, interruptible: true, execute: executeSpy },
    ],
  });

  await registry.executeDecision({
    thought: "hello",
    emotion: { primary: "IDLE", energy: 0.5, mood: "" },
    action: { type: "idle", description: "" },
    speech: null,
  });

  expect(executeSpy).toHaveBeenCalledTimes(1);
});
```

运行测试：

```bash
npm test                              # 全部测试
npx vitest run src/lib/plugins/       # 只跑插件测试
npx vitest run src/lib/plugins/builtin/dancePlugin.test.ts  # 单个文件
```

---

## 注意事项

### 注册顺序

- `action-core` 依赖 `emotion-core`，必须先注册 `emotion-core`
- prompt 拼接顺序 = 注册顺序。先注册的插件 prompt 排在前面
- decision 拦截顺序 = 注册顺序。先注册的插件先拦截

### 命名冲突

- animation name 全局唯一
- action type 全局唯一
- emotion name 全局唯一
- 重复注册会抛异常

### AI 返回未知类型

如果 AI 返回了一个未注册的 `action.type`（如 "fly"），系统会：

1. `executeDecision` 查找 action 失败 → 不执行副作用（不会崩）
2. `Pet` 组件找不到对应动画 → 降级为 idle 绘制
3. 日志会记录 `action=fly`

这是设计上的容错，不需要额外处理。

### 本地降级模式

当用户没有配置 API Key 时，`useBehavior` 会使用本地随机模式：

- 从 `["idle", "walk", "jump", "spin", "yawn"]` 中随机选一个
- walk 时随机生成屏幕坐标
- 不调用 AI，不产生台词
- 间隔与 AI 模式相同（默认 5 秒）

这个行为硬编码在 `useBehavior.ts`，不受插件系统控制。

### 日志

所有 AI 决策都会通过 `appendLogRaw` 写入日志文件：

- **Windows**: `%APPDATA%\com.keypal.app\keypal.log`
- **Linux/macOS**: 日志路径会失败（`commands.rs` 的 `log_dir_path()` 只处理 `APPDATA`）

日志格式：

```
[brain] HAPPY e=0.90 action=walk speech=去那边逛逛~ | 想去那边看看闪闪的东西
[brain] error: missing_api_key
```

---

## 文件索引

| 文件 | 职责 |
|---|---|
| `src/lib/plugins/types.ts` | 所有接口定义 |
| `src/lib/plugins/registry.ts` | PluginRegistry 实现 |
| `src/lib/plugins/index.ts` | createRegistry() — 加载内置插件 |
| `src/lib/plugins/builtin/emotionPlugin.ts` | 5 种基础情绪 |
| `src/lib/plugins/builtin/actionPlugin.ts` | 6 种基础动作 |
| `src/lib/plugins/builtin/speechPlugin.ts` | 台词规则 |
| `src/lib/brainEngine.ts` | AI 大脑：定时决策 + prompt 构建 |
| `src/lib/aiClient.ts` | OpenAI 兼容 API 调用 |
| `src/lib/spriteGenerator.ts` | 动态 spritesheet 生成 |
| `src/lib/spritesheet.ts` | 动画帧控制器 |
| `src/lib/walkController.ts` | 平滑窗口移动 |
| `src/hooks/useBehavior.ts` | 连接 BrainEngine 到 React |
| `src/components/Pet.tsx` | canvas 精灵渲染 |
| `src/components/SpeechBubble.tsx` | 台词气泡 |
