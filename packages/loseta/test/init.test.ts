import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_STYLE } from "../src/config.js";
import { availableStyles, loadRegistry } from "../src/registry.js";
import { resolveInitStyle, styleOptions } from "../src/style-selection.js";

const registry = loadRegistry();

test("init style: rejects an unknown explicit style", () => {
  assert.deepEqual(resolveInitStyle(registry, "other", undefined), {
    error: `Unknown style: other. Available styles: ${availableStyles(registry).join(", ")}.`
  });
});

test("init style: rejects an empty explicit style", () => {
  assert.ok("error" in resolveInitStyle(registry, "", undefined));
});

test("init style: prefers a valid explicit style over an unknown stored style", () => {
  assert.deepEqual(resolveInitStyle(registry, "vega", "other"), { style: "vega" });
});

test("init style: falls back for an unknown stored style", () => {
  assert.deepEqual(resolveInitStyle(registry, undefined, "other"), {
    style: DEFAULT_STYLE,
    warning: `Unknown style in loseta.json: other. Using ${DEFAULT_STYLE}.`
  });
});

test("init style: keeps a valid stored style", () => {
  assert.deepEqual(resolveInitStyle(registry, undefined, "vega"), { style: "vega" });
});

test("init style: defaults when no style is provided", () => {
  assert.deepEqual(resolveInitStyle(registry, undefined, undefined), {
    style: DEFAULT_STYLE
  });
});

test("init style options mirror the registry", () => {
  const options = styleOptions(registry);

  assert.deepEqual(
    options.map((option) => option.value),
    availableStyles(registry)
  );
  assert.ok(options.every((option) => option.label.length > 0 && option.hint.length > 0));
});
