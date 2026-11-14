import { writeConfig } from "./config.js";
import { installItems } from "./install.js";
import type { InstallResult } from "./install.js";
import { installedNames } from "./manifest.js";
import { availableStyles, isStyleName } from "./registry.js";
import type { LosetaConfig, Manifest, Registry, RegistryItem } from "./types.js";

export interface StyleSwitchPlan {
  previous: string;
  nextConfig: LosetaConfig;
  items: RegistryItem[];
}

export type StyleSwitchResolution =
  | { status: "error"; message: string }
  | { status: "noop"; message: string }
  | { status: "switch"; plan: StyleSwitchPlan };

/**
 * Decides whether `loseta style <name>` can run. Pure: no filesystem access,
 * so the command policy is testable without a project.
 */
export function resolveStyleSwitch(
  registry: Registry,
  manifest: Manifest,
  config: LosetaConfig,
  name: string | undefined
): StyleSwitchResolution {
  const available = availableStyles(registry);
  if (!name) {
    return {
      status: "error",
      message: `Usage: loseta style <name>. Available styles: ${available.join(", ")}.`
    };
  }
  if (!isStyleName(registry, name)) {
    return {
      status: "error",
      message: `Unknown style: ${name}. Available styles: ${available.join(", ")}.`
    };
  }
  if (name === config.style) {
    return {
      status: "noop",
      message: `This project already uses the "${name}" style.`
    };
  }

  const installed = installedNames(manifest);
  const items = registry.items.filter(
    (item) =>
      installed.has(item.name) &&
      (item.type === "component" || item.type === "primitive")
  );
  if (items.length === 0) {
    return {
      status: "error",
      message: "No components are installed yet. Run `loseta add <component>` first."
    };
  }

  return {
    status: "switch",
    plan: {
      previous: config.style,
      nextConfig: { ...config, style: name },
      items
    }
  };
}

export interface StyleSwitchResult {
  result: InstallResult;
  kept: string[];
}

/**
 * Applies a resolved style switch: writes the new style files, keeps modified
 * base files, and records the new style in loseta.json.
 */
export async function applyStyleSwitch(input: {
  projectRoot: string;
  registry: Registry;
  sourceRoot: string;
  manifest: Manifest;
  plan: StyleSwitchPlan;
}): Promise<StyleSwitchResult> {
  const kept: string[] = [];
  const result = await installItems({
    projectRoot: input.projectRoot,
    config: input.plan.nextConfig,
    registry: input.registry,
    sourceRoot: input.sourceRoot,
    manifest: input.manifest,
    items: input.plan.items,
    onConflict: (file) => {
      if (file.role === "style") return "overwrite";
      kept.push(file.target);
      return "keep";
    }
  });
  writeConfig(input.projectRoot, input.plan.nextConfig);
  return { result, kept };
}
