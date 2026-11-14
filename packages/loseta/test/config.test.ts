import assert from "node:assert/strict";
import { test } from "node:test";
import { AVAILABLE_STYLES, DEFAULT_STYLE, isStyle } from "../src/config.js";

test("the default style is one of the available styles", () => {
  assert.ok((AVAILABLE_STYLES as readonly string[]).includes(DEFAULT_STYLE));
});

test("isStyle narrows known style names", () => {
  assert.equal(isStyle("nova"), true);
  assert.equal(isStyle("other"), false);
  assert.equal(isStyle(null), false);
  assert.equal(isStyle(undefined), false);
});
