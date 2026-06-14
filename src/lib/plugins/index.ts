import { PluginRegistry } from "./registry";
import { basePlugin } from "./builtin/base";
import { locomotionPlugin } from "./builtin/locomotion";
import { restPlugin } from "./builtin/rest";

export function createRegistry(): PluginRegistry {
  const registry = new PluginRegistry();
  registry.register(basePlugin);
  registry.register(locomotionPlugin);
  registry.register(restPlugin);
  return registry;
}

export { basePlugin, locomotionPlugin, restPlugin };
