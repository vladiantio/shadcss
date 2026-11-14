import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { readConfig } from "../src/config.js";
import { installItems } from "../src/install.js";
import { loadRegistry, registryDir, resolveItems } from "../src/registry.js";
import { resolveAddStyle } from "../src/style-selection.js";
import { applyStyleSwitch, resolveStyleSwitch } from "../src/style-switch.js";
import type { LosetaConfig, Manifest } from "../src/types.js";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tsxBin = join(
  packageRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tsx.cmd" : "tsx"
);
const cliPath = join(packageRoot, "src", "cli.ts");
const config: LosetaConfig = { cssDir: "styles/loseta", style: "nova" };

function project(): string {
  return mkdtempSync(join(tmpdir(), "loseta-style-"));
}

function emptyManifest(): Manifest {
  return { version: "0.0.0", items: [] };
}

function runCli(cwd: string, args: string[]) {
  return spawnSync(tsxBin, [cliPath, ...args], {
    cwd,
    encoding: "utf8",
    timeout: 30_000,
    shell: process.platform === "win32"
  });
}

async function installButton(projectRoot: string) {
  const registry = loadRegistry();
  const result = await installItems({
    projectRoot,
    config,
    registry,
    sourceRoot: registryDir,
    manifest: emptyManifest(),
    items: resolveItems(registry, ["button"]),
    onConflict: () => "keep"
  });
  return { registry, manifest: result.manifest };
}

test("add style accepts the project style and rejects a mismatch", () => {
  const registry = loadRegistry();

  assert.deepEqual(resolveAddStyle(registry, config, undefined), { style: "nova" });
  assert.deepEqual(resolveAddStyle(registry, config, "nova"), { style: "nova" });

  const mismatch = resolveAddStyle(registry, config, "vega");
  assert.ok("error" in mismatch);
  assert.match(mismatch.error, /loseta style vega/);

  const unknown = resolveAddStyle(registry, config, "other");
  assert.ok("error" in unknown);
  assert.match(unknown.error, /Unknown style: other/);
});

test("style switch resolution validates the target and installed items", () => {
  const registry = loadRegistry();
  const manifest: Manifest = {
    version: registry.version,
    items: [
      { name: "tokens", version: registry.version, files: [] },
      { name: "button", version: registry.version, files: [] },
      { name: "dialog", version: registry.version, files: [] },
      { name: "dialog-shell", version: registry.version, files: [] }
    ]
  };

  const missing = resolveStyleSwitch(registry, manifest, config, "");
  assert.equal(missing.status, "error");
  if (missing.status === "error") assert.match(missing.message, /Usage: loseta style/);

  const unknown = resolveStyleSwitch(registry, manifest, config, "other");
  assert.equal(unknown.status, "error");
  if (unknown.status === "error") assert.match(unknown.message, /Unknown style: other/);

  const noop = resolveStyleSwitch(registry, manifest, config, "nova");
  assert.equal(noop.status, "noop");

  const empty = resolveStyleSwitch(registry, emptyManifest(), config, "vega");
  assert.equal(empty.status, "error");
  if (empty.status === "error") assert.match(empty.message, /No components are installed/);

  const resolved = resolveStyleSwitch(registry, manifest, config, "vega");
  assert.equal(resolved.status, "switch");
  if (resolved.status !== "switch") return;

  assert.equal(resolved.plan.previous, "nova");
  assert.equal(resolved.plan.nextConfig.style, "vega");
  assert.deepEqual(
    resolved.plan.items.map((item) => item.name).sort(),
    ["button", "dialog", "dialog-shell"]
  );
});

test("style switch writes the selected style and keeps the old files", async (t) => {
  const projectRoot = project();
  t.after(() => rmSync(projectRoot, { recursive: true, force: true }));

  const { registry, manifest } = await installButton(projectRoot);
  const resolved = resolveStyleSwitch(registry, manifest, config, "vega");
  assert.equal(resolved.status, "switch");
  if (resolved.status !== "switch") return;

  const { result, kept } = await applyStyleSwitch({
    projectRoot,
    registry,
    sourceRoot: registryDir,
    manifest,
    plan: resolved.plan
  });

  assert.deepEqual(kept, []);
  assert.ok(result.written.includes("styles/vega/button.css"));
  assert.ok(!result.written.includes("styles/nova/button.css"));
  assert.equal(readConfig(projectRoot)?.style, "vega");

  const index = readFileSync(join(projectRoot, config.cssDir, "index.css"), "utf8");
  assert.match(index, /styles\/vega\/button\.css/);
  assert.doesNotMatch(index, /styles\/nova\/button\.css/);
  assert.ok(existsSync(join(projectRoot, config.cssDir, "styles", "vega", "button.css")));
  assert.ok(existsSync(join(projectRoot, config.cssDir, "styles", "nova", "button.css")));
});

test("style switch keeps modified base files and overwrites style files", async (t) => {
  const projectRoot = project();
  t.after(() => rmSync(projectRoot, { recursive: true, force: true }));

  const { registry, manifest } = await installButton(projectRoot);
  const basePath = join(projectRoot, config.cssDir, "components", "button.css");
  const novaStylePath = join(projectRoot, config.cssDir, "styles", "nova", "button.css");
  appendFileSync(basePath, "\n/* local base */\n");
  appendFileSync(novaStylePath, "\n/* local style */\n");

  const toVega = resolveStyleSwitch(registry, manifest, config, "vega");
  assert.equal(toVega.status, "switch");
  if (toVega.status !== "switch") return;

  const first = await applyStyleSwitch({
    projectRoot,
    registry,
    sourceRoot: registryDir,
    manifest,
    plan: toVega.plan
  });
  assert.deepEqual(first.kept, ["components/button.css"]);
  assert.match(readFileSync(basePath, "utf8"), /local base/);

  const vegaConfig = readConfig(projectRoot);
  assert.ok(vegaConfig);
  const backToNova = resolveStyleSwitch(registry, first.result.manifest, vegaConfig, "nova");
  assert.equal(backToNova.status, "switch");
  if (backToNova.status !== "switch") return;

  const second = await applyStyleSwitch({
    projectRoot,
    registry,
    sourceRoot: registryDir,
    manifest: first.result.manifest,
    plan: backToNova.plan
  });
  assert.deepEqual(second.kept, ["components/button.css"]);
  assert.ok(second.result.written.includes("styles/nova/button.css"));
  assert.match(readFileSync(basePath, "utf8"), /local base/);
  assert.doesNotMatch(readFileSync(novaStylePath, "utf8"), /local style/);
});

test("CLI: add --style guard and style switch", (t) => {
  const projectRoot = project();
  t.after(() => rmSync(projectRoot, { recursive: true, force: true }));

  const init = runCli(projectRoot, ["init", "--yes"]);
  assert.equal(init.status, 0, init.error?.message ?? init.stderr);

  const add = runCli(projectRoot, ["add", "button", "--yes"]);
  assert.equal(add.status, 0, add.error?.message ?? add.stderr);

  const guard = runCli(projectRoot, ["add", "card", "--style", "vega"]);
  assert.equal(guard.status, 1);
  assert.match(`${guard.stdout}${guard.stderr}`, /loseta style vega/);

  const switched = runCli(projectRoot, ["style", "vega"]);
  assert.equal(switched.status, 0, switched.error?.message ?? switched.stderr);

  const projectConfig = readConfig(projectRoot);
  assert.ok(projectConfig);
  assert.equal(projectConfig.style, "vega");

  const index = readFileSync(join(projectRoot, projectConfig.cssDir, "index.css"), "utf8");
  assert.match(index, /styles\/vega\/button\.css/);
});
