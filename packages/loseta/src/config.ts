import { join, resolve } from "node:path";
import { exists, readTextIfExists, writeText } from "./fs.js";
import type { LosetaConfig } from "./types.js";

export const CONFIG_FILE = "loseta.json";
export const DEFAULT_CSS_DIR = "src/styles/loseta";
export const AVAILABLE_THEMES = ["nova"] as const;
export type Theme = (typeof AVAILABLE_THEMES)[number];
export const DEFAULT_THEME: Theme = "nova";

export function isTheme(value: string | null | undefined): value is Theme {
  return (
    value !== null &&
    value !== undefined &&
    (AVAILABLE_THEMES as readonly string[]).includes(value)
  );
}

const ENTRYPOINT_CANDIDATES = [
  "src/styles/global.css",
  "src/app/globals.css",
  "app/globals.css",
  "src/index.css",
  "styles/global.css",
  "styles.css"
];

/** Absolute path to loseta.json. */
export function configPath(projectRoot: string): string {
  return join(projectRoot, CONFIG_FILE);
}

/** Reads loseta.json when present. */
export function readConfig(projectRoot: string): LosetaConfig | undefined {
  const raw = readTextIfExists(configPath(projectRoot));
  if (!raw) return undefined;
  return JSON.parse(raw) as LosetaConfig;
}

/** Writes loseta.json. */
export function writeConfig(projectRoot: string, config: LosetaConfig): void {
  writeText(configPath(projectRoot), `${JSON.stringify(config, null, 2)}\n`);
}

/** Resolves a config-relative path against the project root. */
export function fromProjectRoot(projectRoot: string, path: string): string {
  return resolve(projectRoot, path);
}

/** Absolute path to the generated index.css. */
export function indexCssPath(projectRoot: string, config: LosetaConfig): string {
  return join(fromProjectRoot(projectRoot, config.cssDir), "index.css");
}

/** Detects a likely CSS entrypoint in the current project. */
export function detectEntrypoint(projectRoot: string): string | undefined {
  return ENTRYPOINT_CANDIDATES.find((candidate) => exists(join(projectRoot, candidate)));
}
