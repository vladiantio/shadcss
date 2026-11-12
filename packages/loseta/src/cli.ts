import { defineCommand, runMain } from "citty";
import { readFileSync } from "node:fs";
import { addCommand } from "./commands/add.js";
import { initCommand } from "./commands/init.js";
import { listCommand } from "./commands/list.js";

process.stdout.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EPIPE") {
    process.exit(0);
  }
  throw error;
});

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8")
) as { version: string; description?: string };

const main = defineCommand({
  meta: {
    name: "loseta",
    version: packageJson.version,
    description: packageJson.description ?? "Native CSS component scaffolds."
  },
  subCommands: {
    init: initCommand,
    add: addCommand,
    list: listCommand
  }
});

runMain(main);
