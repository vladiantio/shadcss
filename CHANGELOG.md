# Changelog

## 0.1.0

### Added

- Native CSS registry with 24 stable components.
- `shadcss` CLI with `init`, `add`, `list`, `add all` and `--html`.
- Foundation files: tokens, reset, base and `sr-only`.
- Nova visual theme with light/dark tokens.
- Internal `popover-primitive` and `dialog-shell` dependencies.
- Registry JSON Schema, integrity validation and generated examples.
- Astro docs site that imports the registry CSS directly.
- Playwright + axe coverage for every docs page in light and dark mode.

### Notes

- The library is CSS-only. Components that need interaction document the
  required ARIA and data-attribute contract; the docs use a demo-only script.
- Experimental components live in `packages/shadcss/experimental` and are not
  part of the published package.
