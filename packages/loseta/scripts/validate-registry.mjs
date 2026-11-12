import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { transform } from "lightningcss";

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, "..");
const registryDir = join(packageRoot, "registry");
const registryPath = join(registryDir, "registry.json");
const schemaPath = join(registryDir, "schema.json");

const forbiddenInBase = [
  { pattern: /\[class\*='size-'\]/g, message: "Tailwind size-* sniffing is not allowed" },
  { pattern: /\.border-[bt]\b/g, message: "Tailwind border utilities are not allowed" },
  { pattern: /\.peer\b/g, message: ".peer is a Tailwind dependency" },
  { pattern: /\.active\b/g, message: ".active is replaced by data-highlighted / ARIA state" },
  { pattern: /!important/g, message: "!important is not allowed" },
  { pattern: /@layer components/g, message: "use loseta.* layers" },
  { pattern: /html\.dark/g, message: "dark rules belong in the theme layer" },
  { pattern: /\[data-state=['"]selected['"]\]/g, message: "use aria-selected" },
  { pattern: /\[data-invalid\]/g, message: "use aria-invalid" },
  { pattern: /\[data-disabled/g, message: "use :disabled or aria-disabled" },
  { pattern: /\[data-selected/g, message: "use aria-selected" },
  { pattern: /\[data-title\]/g, message: "use data-slot=\"title\"" },
  { pattern: /\[data-description\]/g, message: "use data-slot=\"description\"" },
  { pattern: /\[data-shortcut\]/g, message: "use data-slot=\"shortcut\"" },
  { pattern: /\[data-indicator\]/g, message: "use data-slot=\"indicator\"" }
];

const errors = [];

function fail(message) {
  errors.push(message);
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

const registry = readJson(registryPath);
const schema = readJson(schemaPath);

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate = ajv.compile(schema);
if (!validate(registry)) {
  for (const error of validate.errors ?? []) {
    fail(`schema ${error.instancePath || "/"}: ${error.message}`);
  }
}

const items = new Map();
for (const item of registry.items ?? []) {
  if (items.has(item.name)) {
    fail(`duplicate item: ${item.name}`);
  }
  items.set(item.name, item);
}

for (const item of registry.items ?? []) {
  for (const dependency of item.registryDependencies ?? []) {
    if (!items.has(dependency)) {
      fail(`${item.name}: missing registry dependency ${dependency}`);
    }
    if (dependency === item.name) {
      fail(`${item.name}: item depends on itself`);
    }
  }
  for (const dependency of item.optionalDependencies ?? []) {
    if (!items.has(dependency)) {
      fail(`${item.name}: missing optional dependency ${dependency}`);
    }
  }

  const roles = new Set();
  for (const file of item.files ?? []) {
    const absolute = join(registryDir, file.path);
    if (!existsSync(absolute)) {
      fail(`${item.name}: file not found: ${file.path}`);
      continue;
    }

    roles.add(file.role);
    const css = readFileSync(absolute, "utf8");

    if (!css.includes(`@layer ${file.layer} {`)) {
      fail(`${item.name}: ${file.path} is not wrapped in @layer ${file.layer}`);
    }

    for (const rule of forbiddenInBase) {
      if (file.role === "base" && rule.pattern.test(css)) {
        fail(`${item.name}: ${file.path}: ${rule.message}`);
      }
      rule.pattern.lastIndex = 0;
    }

    try {
      transform({
        filename: file.path,
        code: Buffer.from(css),
        minify: false
      });
    } catch (error) {
      fail(`${item.name}: ${file.path}: CSS parse error: ${error.message}`);
    }
  }

  if (item.type === "component" || item.type === "primitive") {
    if (!roles.has("base") || !roles.has("theme")) {
      fail(`${item.name}: expected both base and theme files`);
    }
  }

  for (const example of item.examples ?? []) {
    if (!existsSync(join(registryDir, example))) {
      fail(`${item.name}: example not found: ${example}`);
    }
  }
}

const visitState = new Map();
function visit(name, trail) {
  const state = visitState.get(name);
  if (state === "done") return;
  if (state === "visiting") {
    fail(`dependency cycle: ${[...trail, name].join(" -> ")}`);
    return;
  }
  visitState.set(name, "visiting");
  const item = items.get(name);
  for (const dependency of item?.registryDependencies ?? []) {
    visit(dependency, [...trail, name]);
  }
  visitState.set(name, "done");
}
for (const name of items.keys()) {
  visit(name, []);
}

if (errors.length > 0) {
  console.error(`\nloseta registry validation failed (${errors.length}):\n`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `loseta registry OK: ${items.size} items, ${registry.items.filter((item) => item.type === "component").length} components.`
);
