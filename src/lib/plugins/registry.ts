import {
  AnimationRegistration,
  BehaviorFactory,
  EmotionRegistration,
  PetPlugin,
} from "./types";
import { Behavior } from "../behaviors/types";

export class PluginRegistry {
  private plugins = new Map<string, PetPlugin>();
  private behaviors = new Map<string, BehaviorFactory>();
  private animations = new Map<string, AnimationRegistration>();
  private emotions = new Map<string, EmotionRegistration>();
  private speechPool: string[] = [];

  register(plugin: PetPlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin "${plugin.id}" is already registered`);
    }

    if (plugin.behaviors) {
      for (const factory of plugin.behaviors) {
        if (this.behaviors.has(factory.id)) {
          throw new Error(
            `Behavior "${factory.id}" already registered by another plugin`,
          );
        }
        this.behaviors.set(factory.id, factory);

        if (factory.animation) {
          if (this.animations.has(factory.id)) {
            throw new Error(
              `Animation "${factory.id}" already registered by another plugin`,
            );
          }
          this.animations.set(factory.id, {
            name: factory.id,
            frameCount: factory.animation.frameCount,
            tint: factory.animation.tint,
            draw: factory.animation.draw,
          });
        }
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

    if (plugin.speechPool) {
      this.speechPool.push(...plugin.speechPool);
    }

    this.plugins.set(plugin.id, plugin);
  }

  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    if (plugin.behaviors) {
      for (const factory of plugin.behaviors) {
        this.behaviors.delete(factory.id);
        this.animations.delete(factory.id);
      }
    }
    if (plugin.emotions) {
      for (const emotion of plugin.emotions) {
        this.emotions.delete(emotion.name);
      }
    }

    this.plugins.delete(pluginId);
  }

  getBehavior(id: string): BehaviorFactory | undefined {
    return this.behaviors.get(id);
  }

  createBehavior(id: string, params?: Record<string, unknown>): Behavior | undefined {
    const factory = this.behaviors.get(id);
    return factory?.create(params);
  }

  getAllBehaviors(): BehaviorFactory[] {
    return [...this.behaviors.values()];
  }

  getAnimation(name: string): AnimationRegistration | undefined {
    return this.animations.get(name);
  }

  getAllAnimations(): AnimationRegistration[] {
    return [...this.animations.values()];
  }

  getEmotion(name: string): EmotionRegistration | undefined {
    return this.emotions.get(name);
  }

  getAllEmotions(): EmotionRegistration[] {
    return [...this.emotions.values()];
  }

  getSpeechPool(): string[] {
    return [...this.speechPool];
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
}
