import { defineCommand } from "citty";
import { cancel, confirm, intro, isCancel, log, outro } from "@clack/prompts";
import { join, resolve } from "node:path";
import { readConfig } from "../config.js";
import { copyFile, exists, hashFile, readTextIfExists } from "../fs.js";
import { writeIndex } from "../imports.js";
import {
  installedNames,
  readManifest,
  upsertManifestItem,
  writeManifest
} from "../manifest.js";
import {
  findItem,
  itemMap,
  loadRegistry,
  registryDir,
  resolveItems,
  stableComponents
} from "../registry.js";
import type { ManifestFile } from "../types.js";
import { installedSummary, printItems } from "../ui.js";

const FOUNDATION = ["tokens", "reset", "base", "utilities"];

export const addCommand = defineCommand({
  meta: {
    name: "add",
    description: "Add components to your project."
  },
  args: {
    overwrite: {
      type: "boolean",
      description: "Overwrite existing files without prompting",
      alias: "o"
    },
    noDeps: {
      type: "boolean",
      description: "Do not install registry dependencies"
    },
    html: {
      type: "boolean",
      description: "Print the example HTML for the added components"
    },
    theme: {
      type: "string",
      description: "Theme to use (default: nova)"
    },
    yes: {
      type: "boolean",
      description: "Skip prompts; keep modified files untouched",
      alias: "y"
    }
  },
  async run({ args }) {
    const projectRoot = process.cwd();
    const config = readConfig(projectRoot);
    if (!config) {
      log.error("shadcss.json not found. Run `shadcss init` first.");
      process.exitCode = 1;
      return;
    }

    const manifest = readManifest(projectRoot);
    if (!manifest) {
      log.error(".shadcss/manifest.json not found. Run `shadcss init` first.");
      process.exitCode = 1;
      return;
    }

    const registry = loadRegistry();
    const installed = installedNames(manifest);
    const missingFoundation = FOUNDATION.filter((name) => !installed.has(name));
    if (missingFoundation.length > 0) {
      log.error(
        `The shadcss foundation is incomplete (missing: ${missingFoundation.join(", ")}). Run \`shadcss init\`.`
      );
      process.exitCode = 1;
      return;
    }

    let names = args._.map(String);
    if (names.length === 0) {
      intro("shadcss add");
      printItems(stableComponents(registry));
      outro("Run `shadcss add <component...>` or `shadcss add all`.");
      return;
    }

    if (names.includes("all")) {
      names = stableComponents(registry).map((item) => item.name);
    }

    const map = itemMap(registry);
    for (const name of names) {
      const item = map.get(name);
      if (!item) {
        log.error(`Unknown item: ${name}. Run \`shadcss list\` to see available components.`);
        process.exitCode = 1;
        return;
      }
      if (item.type !== "component" || item.status !== "stable") {
        log.error(
          `${name} is a ${item.type} and cannot be added directly. Dependencies are installed automatically.`
        );
        process.exitCode = 1;
        return;
      }
    }

    const theme = args.theme ?? config.theme;
    if (theme !== "nova") {
      log.error(`Unknown theme: ${theme}. Available themes: nova.`);
      process.exitCode = 1;
      return;
    }

    let resolved;
    if (args.noDeps) {
      resolved = names.map((name) => findItem(registry, name));
      const missing = resolved
        .flatMap((item) => item.registryDependencies ?? [])
        .filter((dependency) => !installed.has(dependency));
      if (missing.length > 0) {
        log.warn(`--no-deps: missing ${[...new Set(missing)].join(", ")}. The component may not work.`);
      }
    } else {
      resolved = resolveItems(registry, names);
    }

    const cssDirAbs = resolve(projectRoot, config.cssDir);
    let copied = 0;
    let skipped = 0;

    for (const item of resolved) {
      const files: ManifestFile[] = [];
      for (const file of item.files) {
        const source = join(registryDir, file.path);
        const target = join(cssDirAbs, file.target);
        const sourceHash = hashFile(source);
        const targetHash = exists(target) ? hashFile(target) : undefined;

        let shouldCopy = true;
        if (targetHash !== undefined) {
          if (targetHash === sourceHash) {
            shouldCopy = false;
          } else if (args.overwrite) {
            shouldCopy = true;
          } else if (args.yes) {
            log.warn(`Keeping modified file: ${file.target}`);
            shouldCopy = false;
          } else {
            const answer = await confirm({
              message: `Overwrite ${file.target}?`,
              initialValue: false
            });
            shouldCopy = !isCancel(answer) && Boolean(answer);
          }
        }

        if (shouldCopy) {
          copyFile(source, target);
          copied += 1;
        } else {
          skipped += 1;
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

    const added = resolved.filter((item) => item.type === "component").map((item) => item.name);
    const primitives = resolved
      .filter((item) => item.type === "primitive")
      .map((item) => item.name);

    log.success(`Added ${installedSummary(added)}.`);
    if (primitives.length > 0) {
      log.info(`Installed dependencies: ${primitives.join(", ")}.`);
    }
    log.info(`${copied} file(s) written, ${skipped} skipped.`);

    if (args.html) {
      for (const name of added) {
        const example = readTextIfExists(join(registryDir, "examples", `${name}.html`));
        if (example === undefined) {
          log.warn(`No example HTML for ${name} yet.`);
          continue;
        }
        console.log(`\n<!-- ${name} -->\n${example.trim()}\n`);
      }
    }

    outro("Done.");
  }
});
