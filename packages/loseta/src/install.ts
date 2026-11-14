import { join, resolve } from "node:path";
import { copyFile, exists, hashFile } from "./fs.js";
import { writeIndex } from "./imports.js";
import { installedNames, upsertManifestItem, writeManifest } from "./manifest.js";
import type {
  LosetaConfig,
  Manifest,
  ManifestFile,
  Registry,
  RegistryFile,
  RegistryItem
} from "./types.js";

export type ConflictResolution = "overwrite" | "keep";

export interface InstallOptions {
  projectRoot: string;
  config: LosetaConfig;
  registry: Registry;
  /** Absolute path to the registry files. Injectable for tests. */
  sourceRoot: string;
  manifest: Manifest;
  items: RegistryItem[];
  onConflict(
    file: RegistryFile,
    item: RegistryItem
  ): ConflictResolution | Promise<ConflictResolution>;
}

export interface InstallResult {
  manifest: Manifest;
  written: string[];
  skipped: string[];
  installed: string[];
}

/**
 * Writes the resolved items, updates the manifest and regenerates index.css.
 * Identical files are skipped without consulting onConflict; a conflict is a
 * target whose hash differs from the registry source.
 */
export async function installItems({
  projectRoot,
  config,
  registry,
  sourceRoot,
  manifest: currentManifest,
  items,
  onConflict
}: InstallOptions): Promise<InstallResult> {
  const manifest: Manifest = {
    version: registry.version,
    items: [...currentManifest.items]
  };
  const cssDirAbs = resolve(projectRoot, config.cssDir);
  const stylePrefix = `styles/${config.style}/`;
  const written: string[] = [];
  const skipped: string[] = [];

  for (const item of items) {
    const files: ManifestFile[] = [];

    for (const file of item.files) {
      if (file.role === "style" && !file.path.startsWith(stylePrefix)) continue;
      const source = join(sourceRoot, file.path);
      const target = join(cssDirAbs, file.target);
      const sourceHash = hashFile(source);
      const targetHash = exists(target) ? hashFile(target) : undefined;

      let shouldCopy = true;
      if (targetHash !== undefined) {
        if (targetHash === sourceHash) {
          shouldCopy = false;
        } else {
          shouldCopy = (await onConflict(file, item)) === "overwrite";
        }
      }

      if (shouldCopy) {
        copyFile(source, target);
        written.push(file.target);
      } else {
        skipped.push(file.target);
      }

      files.push({ path: file.target, hash: hashFile(target) });
    }

    upsertManifestItem(manifest, {
      name: item.name,
      version: registry.version,
      files
    });
  }

  writeManifest(projectRoot, manifest);
  writeIndex(projectRoot, config, registry, installedNames(manifest));

  return {
    manifest,
    written,
    skipped,
    installed: items.map((item) => item.name)
  };
}
