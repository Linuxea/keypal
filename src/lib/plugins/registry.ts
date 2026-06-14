import {
  ActionRegistration,
  AIDecision,
  AnimationRegistration,
  EmotionRegistration,
  PetPlugin,
} from "./types";

export class PluginRegistry {
  private plugins = new Map<string, PetPlugin>();
  private animations = new Map<string, AnimationRegistration>();
  private actions = new Map<string, ActionRegistration>();
  private emotions = new Map<string, EmotionRegistration>();

  register(plugin: PetPlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin "${plugin.id}" is already registered`);
    }

    if (plugin.actionDefinitions) {
      for (const def of plugin.actionDefinitions) {
        if (this.animations.has(def.type)) {
          throw new Error(
            `Animation "${def.type}" already registered by another plugin`,
          );
        }
        if (this.actions.has(def.type)) {
          throw new Error(
            `Action "${def.type}" already registered by another plugin`,
          );
        }
        this.animations.set(def.type, {
          name: def.type,
          frameCount: def.frameCount,
          tint: def.tint,
          draw: def.draw,
        });
        this.actions.set(def.type, {
          type: def.type,
          animation: def.type,
          duration: def.duration,
          interruptible: def.interruptible,
          movement: def.movement,
          execute: def.execute,
        });
      }
    }

    if (plugin.emotions) {
      for (const emotion of plugin.emotions) {
        if (this.emotions.has(emotion.name)) {
          throw new Error(
            `Emotion "${emotion.name}" already registered by another plugin`,
          );
        }
        this.emotions.set(emotion.name, emotion);
      }
    }

    this.plugins.set(plugin.id, plugin);
  }

  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    if (plugin.actionDefinitions) {
      for (const def of plugin.actionDefinitions) {
        this.animations.delete(def.type);
        this.actions.delete(def.type);
      }
    }
    if (plugin.emotions) {
      for (const emotion of plugin.emotions) {
        this.emotions.delete(emotion.name);
      }
    }

    this.plugins.delete(pluginId);
  }

  getAnimation(name: string): AnimationRegistration | undefined {
    return this.animations.get(name);
  }

  getAction(type: string): ActionRegistration | undefined {
    return this.actions.get(type);
  }

  getEmotion(name: string): EmotionRegistration | undefined {
    return this.emotions.get(name);
  }

  getAllAnimations(): AnimationRegistration[] {
    return [...this.animations.values()];
  }

  getAllActions(): ActionRegistration[] {
    return [...this.actions.values()];
  }

  getAllEmotions(): EmotionRegistration[] {
    return [...this.emotions.values()];
  }

  getPlugin(id: string): PetPlugin | undefined {
    return this.plugins.get(id);
  }

  buildSystemPrompt(): string {
    let prompt = "";

    for (const plugin of this.plugins.values()) {
      if (plugin.augmentSystemPrompt) {
        prompt = plugin.augmentSystemPrompt(prompt);
      }
    }

    return prompt;
  }

  async executeDecision(decision: AIDecision): Promise<void> {
    const action = this.actions.get(decision.action.type);
    if (action?.execute) {
      await action.execute({
        targetX: decision.action.params?.targetX as number | undefined,
        targetY: decision.action.params?.targetY as number | undefined,
        description: decision.action.description,
        params: decision.action.params,
      });
    }
  }
}
