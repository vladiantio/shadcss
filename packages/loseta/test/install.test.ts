import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { hashFile } from "../src/fs.js";
import { installItems } from "../src/install.js";
import { loadRegistry, registryDir, resolveItems } from "../src/registry.js";
import type { LosetaConfig, Manifest, Registry } from "../src/types.js";

const config: LosetaConfig = { cssDir: "styles/loseta", style: "nova" };

function project(): string {
  return mkdtempSync(join(tmpdir(), "loseta-install-"));
}

function emptyManifest(): Manifest {
  return { version: "0.0.0", items: [] };
}

function readManifest(projectRoot: string): Manifest {
  return JSON.parse(
    readFileSync(join(projectRoot, ".loseta", "manifest.json"), "utf8")
  ) as Manifest;
}

function readIndex(projectRoot: string): string {
  return readFileSync(join(projectRoot, config.cssDir, "index.css"), "utf8");
}

function readIndexFor(projectRoot: string, cssDir: string): string {
  return readFileSync(join(projectRoot, cssDir, "index.css"), "utf8");
}

function resolve(registry: Registry, names: string[]) {
  return resolveItems(registry, names);
}

test("installs base and style files, manifest and index", async (t) => {
  const projectRoot = project();
  t.after(() => rmSync(projectRoot, { recursive: true, force: true }));

  const registry = loadRegistry();
  const items = resolve(registry, ["dialog"]);
  const result = await installItems({
    projectRoot,
    config,
    registry,
    sourceRoot: registryDir,
    manifest: emptyManifest(),
    items,
    onConflict: () => "keep"
  });

  assert.deepEqual(result.installed, ["dialog-shell", "dialog"]);
  assert.ok(result.written.includes("components/dialog.css"));
  assert.ok(result.written.includes("styles/nova/dialog.css"));
  assert.ok(result.written.includes("primitives/dialog-shell.css"));
  assert.ok(result.written.includes("styles/nova/primitives/dialog-shell.css"));
  assert.equal(result.skipped.length, 0);

  const manifest = readManifest(projectRoot);
  assert.equal(manifest.version, registry.version);
  assert.deepEqual(
    manifest.items.map((item) => item.name),
    ["dialog", "dialog-shell"]
  );
  assert.ok(
    manifest.items.every((item) => item.files.every((file) => file.hash.length === 64))
  );

  const index = readIndex(projectRoot);
  assert.match(
    index,
    /@layer loseta\.tokens, loseta\.reset, loseta\.base, loseta\.components, loseta\.style, loseta\.utilities;/
  );
  assert.ok(index.indexOf("./components/dialog.css") < index.indexOf("./styles/nova/dialog.css"));
});

test("installs the selected style only", async (t) => {
  const projectRoot = project();
  t.after(() => rmSync(projectRoot, { recursive: true, force: true }));

  const registry = loadRegistry();
  const vegaConfig: LosetaConfig = { ...config, style: "vega" };
  const result = await installItems({
    projectRoot,
    config: vegaConfig,
    registry,
    sourceRoot: registryDir,
    manifest: emptyManifest(),
    items: resolve(registry, ["button"]),
    onConflict: () => "keep"
  });

  assert.ok(result.written.includes("components/button.css"));
  assert.ok(result.written.includes("styles/vega/button.css"));
  assert.ok(!result.written.includes("styles/nova/button.css"));

  const index = readIndexFor(projectRoot, vegaConfig.cssDir);
  assert.match(index, /\.\/styles\/vega\/button\.css/);
  assert.doesNotMatch(index, /\.\/styles\/nova\/button\.css/);

  const manifest = readManifest(projectRoot);
  const button = manifest.items.find((item) => item.name === "button");
  assert.deepEqual(
    button?.files.map((file) => file.path).sort(),
    ["components/button.css", "styles/vega/button.css"]
  );
});

test("reinstalling identical files skips without consulting onConflict", async (t) => {
  const projectRoot = project();
  t.after(() => rmSync(projectRoot, { recursive: true, force: true }));

  const registry = loadRegistry();
  const items = resolve(registry, ["button"]);
  const first = await installItems({
    projectRoot,
    config,
    registry,
    sourceRoot: registryDir,
    manifest: emptyManifest(),
    items,
    onConflict: () => "keep"
  });

  const second = await installItems({
    projectRoot,
    config,
    registry,
    sourceRoot: registryDir,
    manifest: first.manifest,
    items,
    onConflict: () => {
      throw new Error("onConflict must not run for identical files");
    }
  });

  assert.equal(second.written.length, 0);
  assert.equal(second.skipped.length, first.written.length);
  assert.deepEqual(second.manifest, first.manifest);
});

test("keeping a modified file records the target hash", async (t) => {
  const projectRoot = project();
  t.after(() => rmSync(projectRoot, { recursive: true, force: true }));

  const registry = loadRegistry();
  const items = resolve(registry, ["button"]);
  const first = await installItems({
    projectRoot,
    config,
    registry,
    sourceRoot: registryDir,
    manifest: emptyManifest(),
    items,
    onConflict: () => "keep"
  });

  const target = join(projectRoot, config.cssDir, "components", "button.css");
  writeFileSync(target, `${readFileSync(target, "utf8")}\n/* local edit */\n`);

  const conflicts: string[] = [];
  await installItems({
    projectRoot,
    config,
    registry,
    sourceRoot: registryDir,
    manifest: first.manifest,
    items,
    onConflict: (file) => {
      conflicts.push(file.target);
      return "keep";
    }
  });

  assert.deepEqual(conflicts, ["components/button.css"]);
  assert.match(readFileSync(target, "utf8"), /local edit/);

  const manifest = readManifest(projectRoot);
  const entry = manifest.items.find((item) => item.name === "button");
  const base = entry?.files.find((file) => file.path === "components/button.css");
  assert.equal(base?.hash, hashFile(target));
});

test("overwriting a modified file restores the registry source", async (t) => {
  const projectRoot = project();
  t.after(() => rmSync(projectRoot, { recursive: true, force: true }));

  const registry = loadRegistry();
  const items = resolve(registry, ["button"]);
  const first = await installItems({
    projectRoot,
    config,
    registry,
    sourceRoot: registryDir,
    manifest: emptyManifest(),
    items,
    onConflict: () => "keep"
  });

  const target = join(projectRoot, config.cssDir, "components", "button.css");
  const source = join(registryDir, "components", "button.css");
  writeFileSync(target, `${readFileSync(target, "utf8")}\n/* local edit */\n`);

  const result = await installItems({
    projectRoot,
    config,
    registry,
    sourceRoot: registryDir,
    manifest: first.manifest,
    items,
    onConflict: () => "overwrite"
  });

  assert.ok(result.written.includes("components/button.css"));
  assert.equal(readFileSync(target, "utf8"), readFileSync(source, "utf8"));

  const manifest = readManifest(projectRoot);
  const entry = manifest.items.find((item) => item.name === "button");
  const base = entry?.files.find((file) => file.path === "components/button.css");
  assert.equal(base?.hash, hashFile(source));
});

test("stamps the current registry version on the manifest", async (t) => {
  const projectRoot = project();
  t.after(() => rmSync(projectRoot, { recursive: true, force: true }));

  const registry = loadRegistry();
  await installItems({
    projectRoot,
    config,
    registry,
    sourceRoot: registryDir,
    manifest: { version: "0.0.1", items: [] },
    items: resolve(registry, ["button"]),
    onConflict: () => "keep"
  });

  assert.equal(readManifest(projectRoot).version, registry.version);
});
