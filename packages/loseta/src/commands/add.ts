import { defineCommand } from "citty";
import { cancel, confirm, intro, isCancel, log, outro } from "@clack/prompts";
import { join } from "node:path";
import { AVAILABLE_THEMES, isTheme, readConfig } from "../config.js";
import { readTextIfExists } from "../fs.js";
import { installItems } from "../install.js";
import { installedNames, readManifest } from "../manifest.js";
import {
  findItem,
  itemMap,
  loadRegistry,
  missingFoundation,
  registryDir,
  resolveItems,
  stableComponents
} from "../registry.js";
import { installedSummary, printItems } from "../ui.js";

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
    const installed = installedNames(manifest);
    const missing = missingFoundation(registry, installed);
    if (missing.length > 0) {
      log.error(
        `The loseta foundation is incomplete (missing: ${missing.join(", ")}). Run \`loseta init\`.`
      );
      process.exitCode = 1;
      return;
    }

    let names = args._.map(String);
    if (names.length === 0) {
      intro("loseta add");
      printItems(stableComponents(registry));
      outro("Run `loseta add <component...>` or `loseta add all`.");
      return;
    }

    if (names.includes("all")) {
      names = stableComponents(registry).map((item) => item.name);
    }

    const map = itemMap(registry);
    for (const name of names) {
      const item = map.get(name);
      if (!item) {
        log.error(`Unknown item: ${name}. Run \`loseta list\` to see available components.`);
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
    if (!isTheme(theme)) {
      log.error(`Unknown theme: ${theme}. Available themes: ${AVAILABLE_THEMES.join(", ")}.`);
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

    const result = await installItems({
      projectRoot,
      config,
      registry,
      sourceRoot: registryDir,
      manifest,
      items: resolved,
      onConflict: async (file) => {
        if (args.overwrite) return "overwrite";
        if (args.yes) {
          log.warn(`Keeping modified file: ${file.target}`);
          return "keep";
        }

        const answer = await confirm({
          message: `Overwrite ${file.target}?`,
          initialValue: false
        });
        return !isCancel(answer) && Boolean(answer) ? "overwrite" : "keep";
      }
    });

    const added = resolved.filter((item) => item.type === "component").map((item) => item.name);
    const primitives = resolved
      .filter((item) => item.type === "primitive")
      .map((item) => item.name);

    log.success(`Added ${installedSummary(added)}.`);
    if (primitives.length > 0) {
      log.info(`Installed dependencies: ${primitives.join(", ")}.`);
    }
    log.info(`${result.written.length} file(s) written, ${result.skipped.length} skipped.`);

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
