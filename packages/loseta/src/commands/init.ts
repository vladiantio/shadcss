import { defineCommand } from "citty";
import { cancel, confirm, intro, isCancel, log, outro, text } from "@clack/prompts";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  DEFAULT_CSS_DIR,
  DEFAULT_THEME,
  detectEntrypoint,
  readConfig,
  writeConfig
} from "../config.js";
import { copyFile, hashFile } from "../fs.js";
import { addEntrypointImport, writeIndex } from "../imports.js";
import {
  installedNames,
  readManifest,
  upsertManifestItem,
  writeManifest
} from "../manifest.js";
import { loadRegistry, registryDir, resolveItems } from "../registry.js";
import type { Manifest, ManifestFile, LosetaConfig } from "../types.js";

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

    if (theme !== "nova") {
      log.error(`Unknown theme: ${theme}. Available themes: nova.`);
      process.exitCode = 1;
      return;
    }

    const config: LosetaConfig = {
      cssDir,
      theme,
      ...(entrypoint ? { entrypoint } : {})
    };
    writeConfig(projectRoot, config);

    const registry = loadRegistry();
    const foundation = registry.items.filter(
      (item) => item.type === "foundation" && item.status === "stable"
    );
    const items = resolveItems(
      registry,
      foundation.map((item) => item.name)
    );

    const cssDirAbs = resolve(projectRoot, cssDir);
    const manifest: Manifest = { version: registry.version, items: [] };

    for (const item of items) {
      const files: ManifestFile[] = [];
      for (const file of item.files) {
        const source = join(registryDir, file.path);
        const target = join(cssDirAbs, file.target);
        copyFile(source, target);
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
