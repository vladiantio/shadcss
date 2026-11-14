import assert from "node:assert/strict";
import { test } from "node:test";
import { AVAILABLE_THEMES, DEFAULT_THEME, isTheme } from "../src/config.js";

test("the default theme is one of the available themes", () => {
  assert.ok((AVAILABLE_THEMES as readonly string[]).includes(DEFAULT_THEME));
});

test("isTheme narrows known theme names", () => {
  assert.equal(isTheme("nova"), true);
  assert.equal(isTheme("other"), false);
  assert.equal(isTheme(null), false);
  assert.equal(isTheme(undefined), false);
});
