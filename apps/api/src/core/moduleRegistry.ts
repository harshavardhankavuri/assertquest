export interface ModuleLifecycle {
  seed: () => Promise<void>;
  reset: () => Promise<void>;
}

const registry = new Map<string, ModuleLifecycle>();

export function registerModule(name: string, lifecycle: ModuleLifecycle): void {
  registry.set(name, lifecycle);
}

export function getModule(name: string): ModuleLifecycle | undefined {
  return registry.get(name);
}

export function allModuleNames(): string[] {
  return [...registry.keys()];
}
