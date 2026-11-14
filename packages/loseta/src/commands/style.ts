import { defineCommand } from "citty";
import { intro, log, outro } from "@clack/prompts";
import { ConfigError, readConfig, writeConfig } from "../config.js";
import { installItems } from "../install.js";
import { installedNames, readManifest } from "../manifest.js";
import {
  availableStyles,
  isStyleName,
  loadRegistry,
  registryDir
} from "../registry.js";
import type { LosetaConfig } from "../types.js";

export const styleCommand = defineCommand({
  meta: {
    name: "style",
    description: "Switch the visual style of installed components."
  },
  async run({ args }) {
    const projectRoot = process.cwd();
    let config: LosetaConfig | undefined;
    try {
      config = readConfig(projectRoot);
    } catch (error) {
      if (error instanceof ConfigError) {
        log.error(error.message);
        process.exitCode = 1;
        return;
      }
      throw error;
    }
    if (!config) {
      log.error("loseta.json not found. Run `loseta init` first.");
      process.exitCode = 1;
      return;
    }

    const manifest = readManifest(projectRoot);
    if (!manifest) {
      log.error(".loseta/manifest.json not found. Run `loseta init` first.");
      process.exitCode = 1;
      return;
    }

    const registry = loadRegistry();
    const name = String(args._[0] ?? "");
    if (!name) {
      log.error(
        `Usage: loseta style <name>. Available styles: ${availableStyles(registry).join(", ")}.`
      );
      process.exitCode = 1;
      return;
    }
    if (!isStyleName(registry, name)) {
      log.error(
        `Unknown style: ${name}. Available styles: ${availableStyles(registry).join(", ")}.`
      );
      process.exitCode = 1;
      return;
    }
    if (name === config.style) {
      log.info(`This project already uses the "${name}" style.`);
      return;
    }

    const installed = installedNames(manifest);
    const items = registry.items.filter(
      (item) =>
        installed.has(item.name) &&
        (item.type === "component" || item.type === "primitive")
    );
    if (items.length === 0) {
      log.error("No components are installed yet. Run `loseta add <component>` first.");
      process.exitCode = 1;
      return;
    }

    intro(`loseta style ${name}`);
    const previous = config.style;
    const nextConfig: LosetaConfig = { ...config, style: name };
    const kept: string[] = [];

    const result = await installItems({
      projectRoot,
      config: nextConfig,
      registry,
      sourceRoot: registryDir,
      manifest,
      items,
      onConflict: (file) => {
        if (file.role === "style") return "overwrite";
        kept.push(file.target);
        return "keep";
      }
    });

    writeConfig(projectRoot, nextConfig);

    log.success(
      `Switched from "${previous}" to "${name}" (${result.written.length} file(s) written).`
    );
    if (kept.length > 0) {
      log.warn(`Kept locally modified base files: ${[...new Set(kept)].join(", ")}.`);
    }
    log.info(
      `The "${previous}" style files remain under ${config.cssDir}/styles/${previous}/ and are no longer imported.`
    );
    outro("Done.");
  }
});
