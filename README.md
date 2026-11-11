# shadcss

Native CSS component scaffolds with the shadcn feel.

shadcss is a registry of component CSS and markup contracts. The CLI copies
readable, layered CSS files into your project, so you own the code and can edit
anything. No Tailwind, no runtime, no framework lock-in.

## Quick start

Requires Node 20+.

```bash
npx shadcss init
npx shadcss add button card field
```

`init` creates the foundation files (tokens, reset, base, utilities) and a
generated `index.css`. `add` copies the structural CSS, the Nova theme file and
any primitive dependency.

```bash
npx shadcss add all          # every stable component
npx shadcss list             # available components
npx shadcss list --all       # include primitives and foundation
npx shadcss add button --html # print the example markup
```

## What you get

- **Native CSS**: nesting, `@layer`, `:has()`, `color-mix()`, logical
  properties, `@starting-style` and `field-sizing`.
- **Copy-paste ownership**: the CLI writes plain CSS files into your project.
- **Tokens and themes**: shadcn-compatible CSS variables, light/dark mode and
  the Nova visual style.
- **CSS-only**: behavior stays yours. Components document the required ARIA and
  data-attribute contract; the docs use a small demo-only script to keep the
  examples interactive.

The v1 registry includes 24 stable components: alert, alert-dialog, badge,
button, button-group, card, checkbox, dialog, dropdown-menu, empty, field,
input, item, kbd, label, native-select, popover, radio, skeleton, switch, table,
tabs, textarea and tooltip.

## Repository

```
packages/shadcss/   CLI, registry, JSON schema and examples
web/                Astro docs site and component playground
```

See [`packages/shadcss/README.md`](packages/shadcss/README.md) for the CLI and
registry details.

## Project documents

- [`GLOSSARY.md`](GLOSSARY.md) defines the project vocabulary.
- [`DESIGN.md`](DESIGN.md) records the durable design baseline: tokens, component
  API, state contract, accessibility floor and change policy.
- [`RELEASING.md`](RELEASING.md) documents the npm and GitHub release process.

## Development

```bash
pnpm install
pnpm cli:build        # compile the TypeScript CLI
pnpm registry:check   # validate the registry and parse every CSS file
pnpm web:dev          # docs site at http://localhost:4321
pnpm web:build        # static docs build
pnpm test             # CLI build + registry validation + Astro check
```

The docs site imports the registry CSS directly, so the examples and the
shipped files cannot drift. Playwright and axe cover every docs page in light
and dark mode:

```bash
pnpm --filter web exec playwright test
```

## License

MIT. See [LICENSE](LICENSE) and [NOTICE](NOTICE) for attribution to shadcn/ui
and Tailwind CSS.
