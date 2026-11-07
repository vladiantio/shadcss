# shadcss docs

Astro site for the shadcss component docs and playground. The site imports the
registry CSS directly from `packages/shadcss/registry`, so the examples and the
published files never drift.

## Commands

```bash
pnpm dev          # start Astro
pnpm build        # regenerate docs CSS + static build
pnpm preview      # preview the build
pnpm check        # astro check
pnpm test:e2e     # build + Playwright + axe
```

From the repo root, use `pnpm web:dev` or `pnpm web:build`.

The generated `web/src/styles/shadcss.css` is committed. Run `pnpm docs:css`
after adding or removing a registry item.
