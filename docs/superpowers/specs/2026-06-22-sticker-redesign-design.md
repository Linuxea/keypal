# KeyPal 贴纸风格重构设计

**日期**: 2026-06-22
**范围**: 视觉 + 渲染/动画层全面重写。保留行为引擎 / AI tick / BehaviorExecutor / 插件注册 / Tauri / 配置 / walk 控制器。

## 1. 目标

- 用 **SVG 贴纸风**取代 32×32 字符串命令像素艺术：粗黑描边 + 白色贴纸剪影 + 饱和填色 + 粉腮红。
- 用 **部件 transform 动画**取代逐帧 spritesheet：耳朵摆动、身体挤压、眨眼、弹跳，平滑省内存。
- 重做全部 UI chrome：气泡、设置面板、右键菜单，并新增**悬停工具栏**。
- 清理过时文档（README 还在描述 emotion-core 老模型）。

## 2. 已确认决策

| 维度 | 决策 |
|------|------|
| 艺术方向 | Bold Sticker / Line-art (SVG) |
| 宠物 | 小咪(圆润耳橘猫)、垂耳小狗(吐舌水汪眼)、呱呱(绿蛙)、叽叽(圆滚小鸡) |
| 交互 | 悬停工具栏(主) + 右键菜单(备用) |
| 范围 | 视觉 + 渲染层；引擎/AI/Tauri 不动 |

## 3. 删除清单

- `src/lib/spriteGenerator.ts` — 字符串命令 spritesheet 拼接
- `src/lib/spritesheet.ts` — 帧控制器
- `src/lib/actions/*.ts` — `renderCommands("E 16 18 9 11 1")` 逐帧绘制 (idle/walk/jump/spin/yawn/sleep/snore)
- `src/lib/actions/index.ts`
- `Pet.tsx` 的 canvas RAF 绘制逻辑（组件本身被 PetView 取代）
- 相关测试：`spriteGenerator.test.ts`、`spritesheet.test.ts`，以及依赖 spritesheet 的测试片段

## 4. 新增架构

### 4.1 宠物艺术 (`src/lib/petArt/`)

每只宠物导出一个 `PetArt` 描述：一个 SVG 由若干**具名部件**(`<g data-part>`)组成。

```ts
export interface PetPart {
  name: string;              // "ears" | "head" | "eyes" | "body" | "legs" | "tail"
  pivot: [number, number];   // viewBox 坐标下的旋转中心
  render: () => ReactNode;   // 该部件的 SVG 内容(已含描边/填色)
}

export interface PetArt {
  viewBox: string;           // "0 0 120 130"
  palette: PetPalette;       // 用于 chrome 配色/气泡色调
  parts: PetPart[];          // 所有部件
}
```

文件：`petArt/cat.ts`、`petArt/dog.ts`、`petArt/frog.ts`、`petArt/chick.ts`、`petArt/index.ts`（按 PetKind 取）。

每个部件统一贴纸处理：粗黑描边 `stroke="#2A1810" stroke-width="3"` + 白色剪影（通过一个 SVG `<filter>` 用 `feMorphology dilate` 生成白色描边底）。部件分层顺序：尾 → 身体 → 肚子 → 腿 → 头 → 耳 → 鼻嘴 → 眼 → 腮红。

### 4.2 动画注册表 (`src/lib/animations/registry.ts`)

声明式动画轨道，按 animationId 索引。每个动画描述各部件随时间的变换关键帧。

```ts
export interface PartTrack {
  rotate?: number[];   // 关键帧(度)
  x?: number[];        // 关键帧(translate px)
  y?: number[];
  scale?: number[];
  dur: number;         // 一次循环 ms
  loop: boolean;
  ease?: "linear" | "sine";
}

export type AnimationDef = Partial<Record<string /*partName*/, PartTrack>>;

export const ANIMATIONS: Record<string, AnimationDef> = {
  idle:  { body: { y:[0,-1.2,0], dur:2000, loop:true },
           eyes:{ scaleY:[1,1,0.1,1,1], dur:4200, loop:true },
           tail:{ rotate:[0,8,0], dur:1600, loop:true } },
  walk:  { legs:{ rotate:[0,20,0,-20,0], dur:600, loop:true },
           body:{ y:[0,-1.5,0], dur:300, loop:true },
           tail:{ rotate:[0,12,-6,0], dur:600, loop:true } },
  jump:  { body:{ y:[0,-26,-26,0], scale:[1,0.92,0.92,1.08,1], dur:800, loop:false } },
  spin:  { body:{ rotate:[0,360], dur:800, loop:false } },
  yawn:  { head:{ rotate:[0,6,0], dur:1400, loop:false },
           body:{ scale:[1,1.03,1], dur:1400, loop:false } },
  sleep: { body:{ y:[0,0.8,0], dur:3000, loop:true },
           eyes:{ scaleY:[1,0.1,0.1], dur:3000, loop:false } },
  snore: { body:{ scale:[1,1.04,1], dur:1800, loop:true },
           eyes:{ scaleY:[1,0.1,0.1], dur:99999, loop:false } },
};
```

所有动画只引用**通用部件**（body/head/eyes/tail/legs），不依赖个别宠物才有的部件；`AnimationDef` 里出现的部件名在驱动器里若找不到对应 `<g data-part>`，该轨道被静默忽略。

### 4.3 动画驱动器 (`src/lib/animations/driver.ts`)

轻量 RAF 驱动。接收动画 id + energy，每帧把插值后的 transform 写到对应 `<g data-part>` 元素的 `transform` 属性上。

```ts
export class AnimationDriver {
  constructor(getPivot: (part: string) => [number, number] | undefined);
  setAnimation(id: string | null, energy: number): void;  // null = 静止默认pose
  bind(elements: Map<string, SVGElement>): void;            // data-part → <g>
  start(): void;
  stop(): void;
}
```

插值规则：
- `t = (elapsed % dur) / dur`；`ease:"sine"` 用 `(1-cos(π·k))/2` 平滑。
- energy 调制：速度 `speed = 0.5 + energy`（累→慢）；幅度 `amp = 0.4 + energy*0.6`（累→动作小）。最终 `rotate = base*amp`，`y/scale` 同理。
- 输出 transform 字符串：`translate(x y) rotate(deg cx cy) scale(s)`，`(cx,cy)` 取自部件 pivot。
- `loop:false` 的动画跑完一轮后停在最后一帧，并回调一次 `onComplete`（PetView 用来回落到 idle——但其实 idle 由行为状态推动，这里只做停止）。

### 4.4 PetView (`src/components/PetView.tsx`)

取代 `Pet.tsx`。消费 `useBehavior` 的 `{ currentAnimation, energy, flipX }`。

```tsx
export function PetView({ pet, animation, energy, flipX, size, onMouseDown, onContextMenu }: Props) {
  // 1. 取 PetArt，渲染 <svg viewBox>
  // 2. 每个部件包成 <g data-part={p.name}>{p.render()}</g>，挂载时收集到 Map
  // 3. 创建 AnimationDriver，绑定 Map，start
  // 4. animation/energy 变化 → driver.setAnimation
  // 5. flipX → <svg style={{ transform: flipX ? 'scaleX(-1)' : 'none' }}>
}
```

渲染层职责到此为止；**不知道行为引擎的存在**，只读 state。

### 4.5 行为/插件接口收窄

- `AnimationRegistration` 删除（被 PetArt/AnimationDef 取代）。
- `BehaviorFactory.animation` 字段：从 `{ frameCount, draw }` 改为 `animation?: string`（该行为对应的 animationId），可选。
- 行为的 `start()` 里 `ctx.emitState({ animation: "walk", ... })` 不变——animationId 字符串照旧。
- `PluginRegistry.getAllAnimations()` 可删除（PetView 直接用全局 `ANIMATIONS`）；若 `useBehavior`/测试仍引用，改为返回 `Object.keys(ANIMATIONS)`。
- `useBehavior` 里 `animations: AnimationRegistration[]` state 改为不再需要（PetView 直接用全局 ANIMATIONS）。

### 4.6 落地接线

`App.tsx`：`<Pet .../>` → `<PetView .../>`。其余（config/window/drag/menu）不动。

## 5. UI Chrome 重做 (`src/components/`)

统一贴纸设计 token（新增 `src/lib/ui/tokens.ts` 或 CSS 变量）：
- 面板底色 `#FFFDF7`，描边 `#2A1810` 2.5px，圆角 14–20px
- 贴纸白边：`box-shadow: 0 0 0 3px #FFFDF7, 0 10px 22px rgba(0,0,0,.4)`
- 强调橙 `#FF9A3C`，粉 `#FF7A8A`，文字 `#2A1810`
- 字体：`"PingFang SC", system-ui` 粗体

- **SpeechBubble**：暖白粗描边圆角气泡 + 贴纸白边阴影 + 尖尾；带一个小圆点状态色（按当前 animation 着色）。
- **SettingsPanel**：贴纸卡片，宠物用贴纸芯片(最终用各自小头像)、大小/间隔用 pill toggle、输入框粗描边、橙色保存按钮。保持现有 onApply 回调签名。
- **ContextMenu**：贴纸卡片版右键菜单（备用入口）。
- **HoverToolbar**（新）：宠物 `pointerenter` 时头顶浮现一排圆形贴纸按钮（换宠下拉/设置/安静模式/退出）；`pointerleave` 收起。安静模式 = 临时停止行为循环，**复用现有 `BrainEngine.start()/stop()`**（已在 `useBehavior` 的 apiKey 变更逻辑里用过），不新增方法。

## 6. 测试策略

- 新增：`driver.test.ts`（关键帧插值、energy 调制、loop 完成回调）、`registry.test.ts`（动画定义合法性、部件匹配）、`PetView.test.tsx`（渲染对应 pet、应用 animation、flipX）。
- 保留：行为/引擎/AI/插件/walk/config 测试不动。
- 删除：`spriteGenerator.test.ts`、`spritesheet.test.ts`，以及 `useBehavior.test.ts`/`Pet.test.tsx` 中断言 spritesheet/帧的部分（改为断言 animation id）。

## 7. 文档

- 更新 `README.md`（架构图、特性表、去掉 emotion-core 老描述）。
- 更新 `AGENTS.md` 的"分层文件结构""添加新行为""关键接口"等段，反映 petArt/animations 新结构。

## 8. 不变项（明确边界）

`brainEngine.ts`、`behaviorExecutor.ts`（双轨队列）、`aiClient.ts`、`walkController.ts`、`config.ts`、`log.ts`、`plugins/registry.ts`、`plugins/index.ts`、`src-tauri/**`、`useDrag.ts` —— 这些文件**不改动**（仅当接口收窄需要极小调整时例外，且须保持外部行为）。
