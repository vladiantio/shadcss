import { defineCommand } from "citty";
import { cancel, confirm, intro, isCancel, log, outro, select, text } from "@clack/prompts";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  ConfigError,
  DEFAULT_CSS_DIR,
  detectEntrypoint,
  readConfig,
  writeConfig
} from "../config.js";
import { addEntrypointImport } from "../imports.js";
import { installItems } from "../install.js";
import { readManifest } from "../manifest.js";
import {
  availableStyles,
  isStyleName,
  loadRegistry,
  registryDir,
  resolveItems,
  stableFoundation
} from "../registry.js";
import { resolveInitStyle, styleOptions } from "../style-selection.js";
import type { LosetaConfig } from "../types.js";

export const initCommand = defineCommand({
  meta: {
    name: "init",
    description: "Set up loseta in this project."
  },
  args: {
    cssDir: {
      type: "string",
      description: "Directory for loseta CSS (default: src/styles/loseta)",
      alias: "c"
    },
    entrypoint: {
      type: "string",
      description: "CSS entrypoint to import loseta from",
      alias: "e"
    },
    style: {
      type: "string",
      description: "Style to install (default: nova)"
    },
    import: {
      type: "boolean",
      description: "Add the @import to the detected entrypoint without prompting"
    },
    yes: {
      type: "boolean",
      description: "Use defaults without prompting",
      alias: "y"
    }
  },
  async run({ args }) {
    const projectRoot = process.cwd();
    intro("loseta init");

    const registry = loadRegistry();
    const foundation = stableFoundation(registry);
    const foundationNames = new Set(foundation.map((item) => item.name));
    const existingManifest = readManifest(projectRoot);
    const tracked =
      existingManifest?.items.filter((item) => !foundationNames.has(item.name)) ?? [];

    if (tracked.length > 0) {
      log.warn(
        `Reinitializing resets the manifest to the foundation. ${tracked.length} installed item(s) stay on disk but are no longer tracked; run \`loseta add all\` to restore them.`
      );
    }

    let existingConfig: LosetaConfig | undefined;
    try {
      existingConfig = readConfig(projectRoot);
    } catch (error) {
      if (error instanceof ConfigError) {
        log.error(error.message);
        process.exitCode = 1;
        return;
      }
      throw error;
    }
    const styleResolution = resolveInitStyle(registry, args.style, existingConfig?.style);
    if ("error" in styleResolution) {
      log.error(styleResolution.error);
      process.exitCode = 1;
      return;
    }
    if (styleResolution.warning) {
      log.warn(styleResolution.warning);
    }
    if (existingConfig && !args.yes) {
      log.warn("loseta.json already exists.");
      const proceed = await confirm({
        message: "Reinitialize and overwrite the foundation files?",
        initialValue: false
      });
      if (isCancel(proceed) || !proceed) {
        cancel("Cancelled.");
        return;
      }
    }

    let cssDir = args.cssDir ?? existingConfig?.cssDir ?? DEFAULT_CSS_DIR;
    let style = styleResolution.style;
    let entrypoint = args.entrypoint ?? existingConfig?.entrypoint ?? detectEntrypoint(projectRoot) ?? "";

    if (!args.yes) {
      const cssDirAnswer = await text({
        message: "Where should the loseta CSS live?",
        placeholder: DEFAULT_CSS_DIR,
        defaultValue: cssDir
      });
      if (isCancel(cssDirAnswer)) {
        cancel("Cancelled.");
        return;
      }
      cssDir = String(cssDirAnswer);

      const styleAnswer = await select({
        message: "Style",
        options: styleOptions(registry),
        initialValue: style
      });
      if (isCancel(styleAnswer)) {
        cancel("Cancelled.");
        return;
      }
      style = styleAnswer;

      const entrypointAnswer = await text({
        message: "CSS entrypoint (leave empty to skip)",
        placeholder: "src/styles/global.css",
        defaultValue: entrypoint
      });
      if (isCancel(entrypointAnswer)) {
        cancel("Cancelled.");
        return;
      }
      entrypoint = String(entrypointAnswer);
    }

    if (!isStyleName(registry, style)) {
      log.error(
        `Unknown style: ${style}. Available styles: ${availableStyles(registry).join(", ")}.`
      );
      process.exitCode = 1;
      return;
    }

    const config: LosetaConfig = {
      cssDir,
      style,
      ...(entrypoint ? { entrypoint } : {})
    };
    writeConfig(projectRoot, config);

    const items = resolveItems(
      registry,
      foundation.map((item) => item.name)
    );

    await installItems({
      projectRoot,
      config,
      registry,
      sourceRoot: registryDir,
      manifest: { version: registry.version, items: [] },
      items,
      onConflict: () => "overwrite"
    });

    if (config.entrypoint) {
      const entrypointAbs = resolve(projectRoot, config.entrypoint);
      if (!existsSync(entrypointAbs)) {
        log.warn(
          `Entrypoint not found: ${config.entrypoint}. Import ${join(cssDir, "index.css")} manually.`
        );
      } else {
        let shouldImport = Boolean(args.import);
        if (!args.yes && args.import === undefined) {
          const answer = await confirm({
            message: `Add @import to ${config.entrypoint}?`,
            initialValue: true
          });
          shouldImport = !isCancel(answer) && Boolean(answer);
        }
        if (shouldImport) {
          const changed = addEntrypointImport(projectRoot, config);
          if (changed) {
            log.success(`Updated ${config.entrypoint}.`);
          }
        } else {
          log.info(
            `Import ${join(cssDir, "index.css")} from ${config.entrypoint} to load loseta.`
          );
        }
      }
    } else {
      log.info(`Import ${join(cssDir, "index.css")} from your CSS entrypoint to load loseta.`);
    }

    outro(`loseta initialized in ${cssDir}`);
  }
});
