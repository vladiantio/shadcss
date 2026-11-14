import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Registry, RegistryItem } from "./types.js";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const registryDir = join(packageRoot, "registry");

/** Loads the bundled registry manifest. */
export function loadRegistry(): Registry {
  return JSON.parse(readFileSync(join(registryDir, "registry.json"), "utf8")) as Registry;
}

/** Returns a name -> item map for the whole registry. */
export function itemMap(registry: Registry): Map<string, RegistryItem> {
  return new Map(registry.items.map((item) => [item.name, item]));
}

/** Returns a single item or fails loudly. */
export function findItem(registry: Registry, name: string): RegistryItem {
  const item = itemMap(registry).get(name);
  if (!item) {
    throw new Error(`Unknown item: ${name}`);
  }
  return item;
}

/**
 * Resolves registry dependencies in install order (dependencies first).
 * Only hard `registryDependencies` are followed; optional composition is metadata.
 */
export function resolveItems(registry: Registry, names: string[]): RegistryItem[] {
  const map = itemMap(registry);
  const ordered: RegistryItem[] = [];
  const seen = new Set<string>();
  const visiting = new Set<string>();

  const visit = (name: string, trail: string[]): void => {
    if (seen.has(name)) return;
    if (visiting.has(name)) {
      throw new Error(`Dependency cycle: ${[...trail, name].join(" -> ")}`);
    }
    const item = map.get(name);
    if (!item) {
      throw new Error(`Unknown item: ${name}`);
    }
    visiting.add(name);
    for (const dependency of item.registryDependencies ?? []) {
      visit(dependency, [...trail, name]);
    }
    visiting.delete(name);
    seen.add(name);
    ordered.push(item);
  };

  for (const name of names) {
    visit(name, []);
  }
  return ordered;
}

/** Stable foundation items, in registry order. */
export function stableFoundation(registry: Registry): RegistryItem[] {
  return registry.items.filter(
    (item) => item.type === "foundation" && item.status === "stable"
  );
}

/** Names of stable foundation items missing from an installed set. */
export function missingFoundation(registry: Registry, installed: Set<string>): string[] {
  return stableFoundation(registry)
    .map((item) => item.name)
    .filter((name) => !installed.has(name));
}

/** Stable component items, alphabetically sorted. */
export function stableComponents(registry: Registry): RegistryItem[] {
  return registry.items
    .filter((item) => item.type === "component" && item.status === "stable")
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** All items that can be installed by `add`. */
export function installableItems(registry: Registry): RegistryItem[] {
  return registry.items
    .filter((item) => item.type === "component" || item.type === "primitive")
    .sort((a, b) => a.name.localeCompare(b.name));
}
