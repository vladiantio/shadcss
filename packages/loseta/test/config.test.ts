import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_STYLE } from "../src/config.js";
import { availableStyles, isStyleName, loadRegistry } from "../src/registry.js";

test("the default style is declared by the registry", () => {
  assert.ok(availableStyles(loadRegistry()).includes(DEFAULT_STYLE));
});

test("isStyleName narrows declared style names", () => {
  const registry = loadRegistry();
  assert.equal(isStyleName(registry, "nova"), true);
  assert.equal(isStyleName(registry, "vega"), true);
  assert.equal(isStyleName(registry, "other"), false);
  assert.equal(isStyleName(registry, null), false);
  assert.equal(isStyleName(registry, undefined), false);
});
