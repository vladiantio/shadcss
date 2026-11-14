import { defineCommand } from "citty";
import { cancel, confirm, intro, isCancel, log, outro, text } from "@clack/prompts";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  AVAILABLE_THEMES,
  DEFAULT_CSS_DIR,
  DEFAULT_THEME,
  detectEntrypoint,
  isTheme,
  readConfig,
  writeConfig
} from "../config.js";
import { addEntrypointImport } from "../imports.js";
import { installItems } from "../install.js";
import { readManifest } from "../manifest.js";
import { loadRegistry, registryDir, resolveItems, stableFoundation } from "../registry.js";
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
    theme: {
      type: "string",
      description: "Theme to install (default: nova)",
      default: DEFAULT_THEME
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

    const existingConfig = readConfig(projectRoot);
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
    let theme = args.theme ?? existingConfig?.theme ?? DEFAULT_THEME;
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

      const themeAnswer = await text({
        message: "Theme",
        placeholder: DEFAULT_THEME,
        defaultValue: theme
      });
      if (isCancel(themeAnswer)) {
        cancel("Cancelled.");
        return;
      }
      theme = String(themeAnswer);

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

    if (!isTheme(theme)) {
      log.error(`Unknown theme: ${theme}. Available themes: ${AVAILABLE_THEMES.join(", ")}.`);
      process.exitCode = 1;
      return;
    }

    const config: LosetaConfig = {
      cssDir,
      theme,
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
