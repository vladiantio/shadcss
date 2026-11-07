import { join } from "node:path";
import { readTextIfExists, writeText } from "./fs.js";
import type { Manifest, ManifestItem } from "./types.js";

export const MANIFEST_FILE = ".shadcss/manifest.json";

/** Absolute path to the install manifest. */
export function manifestPath(projectRoot: string): string {
  return join(projectRoot, MANIFEST_FILE);
}

/** Reads .shadcss/manifest.json when present. */
export function readManifest(projectRoot: string): Manifest | undefined {
  const raw = readTextIfExists(manifestPath(projectRoot));
  if (!raw) return undefined;
  return JSON.parse(raw) as Manifest;
}

/** Writes .shadcss/manifest.json. */
export function writeManifest(projectRoot: string, manifest: Manifest): void {
  writeText(manifestPath(projectRoot), `${JSON.stringify(manifest, null, 2)}\n`);
}

/** Inserts or replaces an installed item in the manifest. */
export function upsertManifestItem(manifest: Manifest, item: ManifestItem): void {
  const index = manifest.items.findIndex((entry) => entry.name === item.name);
  if (index === -1) {
    manifest.items.push(item);
  } else {
    manifest.items[index] = item;
  }
  manifest.items.sort((a, b) => a.name.localeCompare(b.name));
}

/** Set of installed item names. */
export function installedNames(manifest: Manifest): Set<string> {
  return new Set(manifest.items.map((item) => item.name));
}
