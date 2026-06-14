import { PluginRegistry } from "./registry";
import { emotionPlugin } from "./builtin/emotionPlugin";
import { locomotionPlugin } from "./builtin/locomotion";
import { restPlugin } from "./builtin/rest";
import { speechPlugin } from "./builtin/speechPlugin";

export function createRegistry(): PluginRegistry {
  const registry = new PluginRegistry();
  registry.register(emotionPlugin);
  registry.register(locomotionPlugin);
  registry.register(restPlugin);
  registry.register(speechPlugin);
  return registry;
}

export { emotionPlugin, locomotionPlugin, restPlugin, speechPlugin };
