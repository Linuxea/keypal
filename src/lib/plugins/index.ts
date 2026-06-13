import { PluginRegistry } from "./registry";
import { emotionPlugin } from "./builtin/emotionPlugin";
import { actionPlugin } from "./builtin/actionPlugin";
import { speechPlugin } from "./builtin/speechPlugin";

export function createRegistry(): PluginRegistry {
  const registry = new PluginRegistry();
  registry.register(emotionPlugin);
  registry.register(actionPlugin);
  registry.register(speechPlugin);
  return registry;
}

export { emotionPlugin, actionPlugin, speechPlugin };
