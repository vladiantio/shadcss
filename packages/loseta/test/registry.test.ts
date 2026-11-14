import assert from "node:assert/strict";
import { test } from "node:test";
import { loadRegistry, resolveItems } from "../src/registry.js";
import type { Registry } from "../src/types.js";

test("resolveItems installs registry dependencies before their dependents", () => {
  const registry = loadRegistry();
  const names = resolveItems(registry, ["dialog"]).map((item) => item.name);

  const dependency = names.indexOf("dialog-shell");
  const dependent = names.indexOf("dialog");

  assert.notEqual(dependency, -1);
  assert.notEqual(dependent, -1);
  assert.ok(dependency < dependent);
});

test("resolveItems fails on unknown items", () => {
  const registry = loadRegistry();

  assert.throws(() => resolveItems(registry, ["missing"]), /Unknown item: missing/);
});

test("resolveItems fails on dependency cycles", () => {
  const registry: Registry = {
    name: "test",
    version: "0.0.0",
    items: [
      {
        name: "a",
        type: "component",
        status: "stable",
        title: "A",
        description: "A",
        root: [],
        registryDependencies: ["b"],
        files: []
      },
      {
        name: "b",
        type: "component",
        status: "stable",
        title: "B",
        description: "B",
        root: [],
        registryDependencies: ["a"],
        files: []
      }
    ]
  };

  assert.throws(() => resolveItems(registry, ["a"]), /Dependency cycle: a -> b -> a/);
});
