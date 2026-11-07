import { join, resolve } from "node:path";
import { exists, readTextIfExists, writeText } from "./fs.js";
import type { ShadcssConfig } from "./types.js";

export const CONFIG_FILE = "shadcss.json";
export const DEFAULT_CSS_DIR = "src/styles/shadcss";
export const DEFAULT_THEME = "nova";

const ENTRYPOINT_CANDIDATES = [
  "src/styles/global.css",
  "src/app/globals.css",
  "app/globals.css",
  "src/index.css",
  "styles/global.css",
  "styles.css"
];

/** Absolute path to shadcss.json. */
export function configPath(projectRoot: string): string {
  return join(projectRoot, CONFIG_FILE);
}

/** Reads shadcss.json when present. */
export function readConfig(projectRoot: string): ShadcssConfig | undefined {
  const raw = readTextIfExists(configPath(projectRoot));
  if (!raw) return undefined;
  return JSON.parse(raw) as ShadcssConfig;
}

/** Writes shadcss.json. */
export function writeConfig(projectRoot: string, config: ShadcssConfig): void {
  writeText(configPath(projectRoot), `${JSON.stringify(config, null, 2)}\n`);
}

/** Resolves a config-relative path against the project root. */
export function fromProjectRoot(projectRoot: string, path: string): string {
  return resolve(projectRoot, path);
}

/** Absolute path to the generated index.css. */
export function indexCssPath(projectRoot: string, config: ShadcssConfig): string {
  return join(fromProjectRoot(projectRoot, config.cssDir), "index.css");
}

/** Detects a likely CSS entrypoint in the current project. */
export function detectEntrypoint(projectRoot: string): string | undefined {
  return ENTRYPOINT_CANDIDATES.find((candidate) => exists(join(projectRoot, candidate)));
}
