import { defineCommand } from "citty";
import pc from "picocolors";
import { loadRegistry, stableComponents } from "../registry.js";
import { printItems } from "../ui.js";

export const listCommand = defineCommand({
  meta: {
    name: "list",
    description: "List available components."
  },
  args: {
    all: {
      type: "boolean",
      description: "Include primitives and foundation items",
      alias: "a"
    },
    json: {
      type: "boolean",
      description: "Print the registry as JSON"
    }
  },
  run({ args }) {
    const registry = loadRegistry();
    const components = stableComponents(registry);

    if (args.json) {
      const items = args.all ? registry.items : components;
      console.log(JSON.stringify(items, null, 2));
      return;
    }

    console.log(pc.bold("Components"));
    printItems(components);

    if (args.all) {
      const primitives = registry.items.filter((item) => item.type === "primitive");
      const foundation = registry.items.filter((item) => item.type === "foundation");
      console.log(`\n${pc.bold("Primitives")}`);
      printItems(primitives);
      console.log(`\n${pc.bold("Foundation")}`);
      printItems(foundation);
    }
  }
});
