import { DEFAULT_STYLE } from "./config.js";
import { availableStyles, isStyleName } from "./registry.js";
import type { LosetaConfig, Registry } from "./types.js";

/** Option shape expected by the `@clack/prompts` select prompt. */
export interface StyleOption {
  value: string;
  label: string;
  hint: string;
}

/** Select options for the styles declared by the registry. */
export function styleOptions(registry: Registry): StyleOption[] {
  return registry.styles.map((style) => ({
    value: style.name,
    label: style.title,
    hint: style.description
  }));
}

export type InitStyleResolution =
  | { style: string; warning?: string }
  | { error: string };

/**
 * Resolves the style for `init` before any prompt.
 *
 * An explicit `--style` is authoritative: an unknown value is an error, never a
 * fallback. An unknown stored style falls back to the default with a warning.
 */
export function resolveInitStyle(
  registry: Registry,
  argsStyle: string | undefined,
  configStyle: string | undefined
): InitStyleResolution {
  if (argsStyle !== undefined) {
    if (!isStyleName(registry, argsStyle)) {
      return {
        error: `Unknown style: ${argsStyle}. Available styles: ${availableStyles(registry).join(", ")}.`
      };
    }
    return { style: argsStyle };
  }

  if (configStyle !== undefined && !isStyleName(registry, configStyle)) {
    return {
      style: DEFAULT_STYLE,
      warning: `Unknown style in loseta.json: ${configStyle}. Using ${DEFAULT_STYLE}.`
    };
  }

  return { style: configStyle ?? DEFAULT_STYLE };
}

export type AddStyleResolution = { style: string } | { error: string };

/**
 * Resolves the style for `add`. An explicit `--style` must match the project
 * style; switching is `loseta style <name>`'s job.
 */
export function resolveAddStyle(
  registry: Registry,
  config: LosetaConfig,
  argsStyle: string | undefined
): AddStyleResolution {
  const style = argsStyle ?? config.style;
  if (!isStyleName(registry, style)) {
    return {
      error: `Unknown style: ${style}. Available styles: ${availableStyles(registry).join(", ")}.`
    };
  }
  if (argsStyle !== undefined && argsStyle !== config.style) {
    return {
      error: `This project uses the "${config.style}" style. Run \`loseta style ${argsStyle}\` to switch styles.`
    };
  }
  return { style };
}
