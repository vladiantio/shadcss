// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "tap"
  },
  vite: {
    server: {
      fs: {
        // Allow serving the registry CSS from the monorepo root.
        allow: [".."]
      }
    }
  }
});
