# Changelog

## Unreleased

### Added

- Code Block component with an optional header, actions, line numbers, diff and
  highlighted lines, wrap and size variants, and a destructive variant.
- Docs code snippets now use the registry Code Block anatomy.

### Changed

- **Breaking:** renamed the visual axis from "theme" to "style" to match
  shadcn/ui vocabulary. `loseta.json` now uses the `style` key instead of
  `theme`, the CLI flag is `--style`, installed visual files live under
  `styles/<name>/` instead of `themes/<name>/`, the registry file role is
  `style`, and the cascade layer is `loseta.style` instead of `loseta.theme`.
  Projects created with 0.1.0 must rename the config key, move the installed
  `themes/` directory to `styles/`, and re-add their items; the CLI reports the
  required steps when it reads an old config.
- The docs color-scheme preference now uses the storage key `scheme` and the
  `data-scheme` attribute instead of `theme` and `data-theme`.
- `loseta add` now records the registry version on the install manifest.
- Re-running `loseta init` warns that installed items stay on disk but are no
  longer tracked, and names `loseta add all` as the restore command.

## 0.1.0 - 2026-11-12

### Added

- Native CSS registry with 24 stable components.
- `loseta` CLI with `init`, `add`, `list`, `add all` and `--html`.
- Foundation files: tokens, reset, base and `sr-only`.
- Nova visual theme with light/dark tokens.
- Internal `popover-primitive` and `dialog-shell` dependencies.
- Registry JSON Schema, integrity validation and generated examples.
- Astro docs site that imports the registry CSS directly.
- Playwright + axe coverage for every docs page in light and dark mode.

### Changed

- The package, CLI, config file, manifest directory and CSS layers now use the
  `loseta` name.

### Notes

- The library is CSS-only. Components that need interaction document the
  required ARIA and data-attribute contract; the docs use a demo-only script.
- Experimental components live in `packages/loseta/experimental` and are not
  part of the published package.
