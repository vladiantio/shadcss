# Agent guide

loseta is a copy-paste registry of native CSS components with a documented
markup contract. The registry is the product; the docs site renders the same
files consumers install.

## Read first

- `GLOSSARY.md` — read when naming a concept, writing docs or choosing an
  attribute. It fixes the project vocabulary; use its terms.
- `DESIGN.md` — read before changing any public class, attribute, token, state
  or layer. It is the v1 contract for layers, tokens, component API,
  accessibility and compatibility. If it disagrees with the registry,
  `packages/loseta/registry/tokens.css` and `registry.json` are authoritative;
  correct the document.
- `packages/loseta/README.md` — read before changing CLI commands, install
  behavior or registry layout.

## Non-negotiables

- Native CSS only: no Tailwind, CSS-in-JS, preprocessor or framework
  dependency in the registry.
- The registry is CSS-only: loseta ships styling, not behavior. The docs client
  demo behavior in `web/src/scripts/docs-client/demo.ts` must not become a
  registry dependency.
- `.sr-only` is the only utility.
- Class names and tokens are prefix-free.
- The layer order is fixed: `loseta.tokens`, `loseta.reset`, `loseta.base`,
  `loseta.components`, `loseta.theme`, `loseta.utilities`.
- Public API changes require updating `DESIGN.md` and the docs that describe
  them. Breaking changes also require a `CHANGELOG.md` entry.

## Layout

- `packages/loseta/registry/` — published catalog: foundations, primitives,
  components, Nova theme, examples and `registry.json`.
- `packages/loseta/src/` — CLI (`init`, `add`, `list`).
- `packages/loseta/experimental/` — unpublished work outside the v1 contract.
- `web/` — Astro docs site; it imports the registry CSS directly.

## Base/theme split

Every component and primitive ships two files:

- **Base** (`components/`, `primitives/`): anatomy, layout and behavior hooks.
- **Theme** (`themes/nova/`): color, typography, spacing, radii, surfaces,
  shadows and motion.

Base files may use tokens for structural state semantics (for example invalid
text or a selected row), but prefer the theme file for visual treatment.
Dark-mode adjustments (`html.dark`) belong in theme files. Nova is the only
theme in v1.

## Registry workflow

1. Edit the base and/or theme file under `packages/loseta/registry/`.
2. Update the item in `registry.json`: `title`, `description`, `root`, `files`,
   dependencies, `status`, `docs` and `examples` as applicable.
3. Edit example markup in `web/src/data/examples.ts`. Use the demo hooks
   (`data-demo`, `data-demo-trigger`, `data-open-dialog`, `data-close-dialog`)
   only for docs behavior; the generator strips them.
4. Run `pnpm registry:examples` to regenerate
   `packages/loseta/registry/examples/` and the `examples` fields.
5. Run `pnpm test`. For visual or docs changes, run
   `pnpm --filter web test:e2e`.

When adding a component, also add its group and any contract note in
`web/src/data/components.ts`. Keep experimental CSS in
`packages/loseta/experimental/` until the component has base/theme files,
registry metadata, an example and docs coverage.

## CSS rules

- Wrap every file in its exact layer: `@layer loseta.<layer> { ... }`.
- State lives in native pseudo-classes and ARIA: `:disabled`, `:checked`,
  `:focus-visible`, `[open]`, `aria-invalid`, `aria-selected`, `aria-checked`,
  `aria-disabled`, `aria-expanded`, `aria-hidden`.
- `data-highlighted` is the only public data-driven state beyond variant, size
  and placement attributes. Express everything else with the hooks above.
- Name parts with `data-slot` when no semantic element already carries the
  role; prefer `header`, `section`, `footer`, `figure` and `aside` where the
  anatomy provides them.
- Use logical properties (`margin-inline`, `inset-inline-start`) and logical
  placement values.
- No `!important`. Derive transparency with
  `color-mix(in oklab, var(--token) N%, transparent)`; raw palette colors are
  limited to SVG data URIs and the dialog backdrop.

## Generated files

Regenerate these; do not edit them by hand:

- `packages/loseta/registry/examples/*.html` from
  `web/src/data/examples.ts` (`pnpm registry:examples`).
- `web/src/styles/loseta.css` from the stable registry items
  (`pnpm docs:css`, also run by `pnpm web:dev` and `pnpm web:build`).

CI fails when either generated artifact differs from the committed files.
`packages/loseta/dist/` and `web/.astro/` are build output and ignored.

## Verification

`pnpm test` is the default gate: it builds the CLI, validates the registry and
runs `astro check`.

```bash
pnpm install
pnpm test
pnpm registry:check      # fast registry and CSS validation
pnpm web:dev             # docs at http://localhost:4321
pnpm --filter web test:e2e
```

`registry:check` enforces schema conformance, file and example existence,
dependency resolution and cycles, exact layer wrapping, forbidden patterns and
CSS parseability. Fix the source rather than bypassing it.

Before calling a change done, `pnpm test` must pass and `git status` must show
only the intended source and regenerated files. Write docs, comments and commit
messages in English; follow the existing Conventional Commit style
(`feat(scope):`, `fix(scope):`, `docs:`).
