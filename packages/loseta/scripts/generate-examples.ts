import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { examples } from "../../../web/src/data/examples.ts";

const here = dirname(fileURLToPath(import.meta.url));
const registryDir = join(here, "..", "registry");
const examplesDir = join(registryDir, "examples");
const registryPath = join(registryDir, "registry.json");

mkdirSync(examplesDir, { recursive: true });

const demoAttribute = /\sdata-(demo-trigger|demo|open-dialog|close-dialog)(?:="[^"]*")?/g;

for (const [name, list] of Object.entries(examples)) {
  const content = list
    .map(
      (example) =>
        `<!-- ${example.title} -->\n${example.html.replace(demoAttribute, "").trim()}`
    )
    .join("\n\n");
  writeFileSync(join(examplesDir, `${name}.html`), `${content}\n`);
}

const registry = JSON.parse(readFileSync(registryPath, "utf8")) as {
  items: Array<{
    name: string;
    type: string;
    examples?: string[];
  }>;
};

for (const item of registry.items) {
  if (item.type === "component" && examples[item.name]) {
    item.examples = [`examples/${item.name}.html`];
  }
}

writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
console.log(`Generated ${Object.keys(examples).length} example files.`);
