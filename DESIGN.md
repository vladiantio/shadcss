# loseta design baseline

This is the durable design contract for loseta v1. It defines the visual
language, token roles, component API, state contract, accessibility floor and
compatibility policy that the registry promises to consumers.

It is not an implementation guide. The installed CSS is the reference
implementation: if this document and the registry disagree,
[`packages/loseta/registry/tokens.css`](packages/loseta/registry/tokens.css)
and [`registry.json`](packages/loseta/registry/registry.json) win, and this
document must be corrected. The baseline covers registry version `0.3.0`.

Vocabulary is defined in [`GLOSSARY.md`](GLOSSARY.md).

## Principles

1. **Native first.** Components are plain CSS built on modern platform
   features: nesting, `@layer`, `:has()`, `color-mix()`, logical properties,
   native `<dialog>`, `@starting-style` and `field-sizing`. There is no
   Tailwind, runtime or framework dependency.
2. **The consumer owns the code.** The CLI copies files into the project.
   Unmodified installed files are the contract; edited files are the
   consumer's own divergence.
3. **Structure and style are separate.** Base files describe anatomy, layout
   and state hooks. Style files supply the visual treatment.
4. **Semantic HTML and platform states come first.** Styling reads ARIA and
   native pseudo-classes, not bespoke state classes. loseta ships no
   JavaScript behavior.
5. **Tokens are the customization surface.** Visual decisions should be
   changeable through tokens before they require editing a component or style
   file.
6. **Quiet by default.** The default system is neutral, with strong foreground
   and background contrast in light and dark mode, and restrained: primary
   actions carry the strongest fill; destructive color is reserved for
   destructive intent and validation.
7. **Composition over configuration.** Field, button group, card and item
   compose by markup. Components do not require a parent wrapper class to
   work together.
8. **Accessibility is part of the API.** Focus visibility, semantics and
   state exposure are contract, not polish.

## Scope

The v1 registry contains 31 stable items:

- **25 components**: alert, alert-dialog, badge, button, button-group, card,
  checkbox, code-block, dialog, dropdown-menu, empty, field, input, item, kbd,
  label, native-select, popover, radio, skeleton, switch, table, tabs, textarea
  and tooltip.
- **2 primitives**: `dialog-shell` and `popover-primitive`. They are installed
  automatically as dependencies and are not consumer-facing components.
- **4 foundations**: tokens, reset, base and utilities.

Experimental CSS lives in `packages/loseta/experimental/`. It is neither
published nor covered by this baseline. The one shipped utility is
`.sr-only`.

## Styles

The registry declares its styles in `registry.json`. Nova is the default. The
complete set is Vega, Nova, Maia, Lyra, Mira, Luma, Sera and Rhea. A style owns
geometry, spacing, control sizes, radii and the type scale. Anatomy, markup,
tokens, layers and the state contract are shared, so switching styles never
requires markup changes.

`loseta.json` selects one style per project. `loseta init --style` chooses it,
`loseta style <name>` switches it, and the CLI copies only the style files for
the selected style. A style-only change does not rewrite base files.

The browser fidelity target is Chrome/Edge 125+, Safari 26+ and Firefox 147+.
Older engines may render a reduced experience where they lack `:has()`,
`@starting-style` or `field-sizing`.

## Layer contract

Every generated `index.css` declares this order before importing any file:

```css
@layer loseta.tokens, loseta.reset, loseta.base, loseta.components, loseta.style, loseta.utilities;
```

| Layer | Owner | Responsibility |
| --- | --- | --- |
| `loseta.tokens` | foundation | Custom properties, light/dark token values, `color-scheme`. |
| `loseta.reset` | foundation | Minimal reset: box sizing, borders, margins, media defaults, form inheritance. Not a full preflight. |
| `loseta.base` | foundation | Global element defaults: page colors, button cursor, selection color, outline color. |
| `loseta.components` | base files and primitives | Anatomy, layout, behavior hooks and structural state rules. |
| `loseta.style` | style files | Color, typography, spacing, radii, shadows, surfaces and animations. |
| `loseta.utilities` | foundation | Only `.sr-only` in v1. |

Rules:

- The order is fixed. Consumers may add their own layers after it.
- Base and style files for an item are installed separately and imported by
  the generated entrypoint: base files first, style files second.
- A new visual decision belongs in the style layer. Base files may consume
  tokens for structural semantics (for example, invalid text or a selected
  row), but they must not become the primary place for visual styling.
- Do not use `!important` to cross layers. Fix ownership instead.
- Class names and tokens are unprefixed. Use one design system per project to
  avoid collisions.

## Tokens

Tokens are the shadcn-compatible custom properties in
`packages/loseta/registry/tokens.css`. The token file is the source of truth
for values; this table defines intent.

### Color roles

| Role | Intent |
| --- | --- |
| `--background`, `--foreground` | Page surface and primary text. |
| `--card`, `--card-foreground` | Cards and alerts. |
| `--popover`, `--popover-foreground` | Dialogs, popovers, menus and tooltips. |
| `--primary`, `--primary-foreground` | Primary actions and checked controls. |
| `--secondary`, `--secondary-foreground` | Secondary actions and badges. |
| `--muted`, `--muted-foreground` | Subdued surfaces, descriptions and secondary text. |
| `--accent`, `--accent-foreground` | Highlighted and focused menu items. |
| `--destructive` | Destructive actions, invalid borders and invalid text. |
| `--border` | Separators, card outlines and outline-variant borders. |
| `--input` | Form-control borders and subtle control fills in dark mode. |
| `--ring` | Focus border and focus shadow. |
| `--chart-*`, `--sidebar-*`, `--scrollbar-*` | Reserved token families shipped with the style; v1 components do not consume them. |

Transparency is derived with `color-mix(in oklab, var(--token) N%, transparent)`
or `currentColor`; raw palette colors do not belong in component CSS except
for embedded SVG data URIs and the dialog backdrop.

### Light and dark

- Light is the default in `:root`. Dark values are applied by `.dark` on the
  `<html>` element; the token file also sets `color-scheme` so native controls
  follow the color scheme.
- Components reference role tokens. A style may add `html.dark` adjustments for
  contrast, but a component must not invent a separate dark palette.
- Every documented page is exercised in light and dark mode in CI.

### Radius

`--radius` is `0.625rem`. The scale is multiplicative:

| Token | Multiplier | Typical use |
| --- | --- | --- |
| `--radius-sm` | `0.6` | Kbd and item media. |
| `--radius-md` | `0.8` | Menu items, tooltip, skeleton, small controls. |
| `--radius-lg` | `1` | Buttons, inputs, selects, alerts, items, menus, popovers. |
| `--radius-xl` | `1.4` | Cards, dialogs and alert dialogs. |
| `--radius-2xl`–`--radius-4xl` | `1.8`–`2.6` | Available scale; badge uses `--radius-4xl` for a pill. |
| `--radius-full` | infinite | Radios, switches and circular media. |

Small controls cap their radius with `min(var(--radius-md), 10px or 12px)` so
they do not become visually rounder than their surface. Checkboxes use a
fixed 4px radius. Code Block uses `--radius-xl`; its `sm` size uses
`--radius-lg`. These caps are part of the Nova style; Vega uses
`--radius-md` for controls and caps them at smaller values.

### Typography

- loseta ships **no UI font family**. The reset makes form controls inherit and
  the system inherits the host document's typography.
- Code Block uses a monospace stack with `var(--font-mono, …)` so consumers can
  point it at their own mono family without a global font token.
- UI text defaults to `--text-sm` (`0.875rem`), with its paired line height.
  Cards, alerts, items, tables, menus, tabs, code blocks and dialog bodies
  follow it.
- Inputs and textareas use `--text-base` (`1rem`) below `48rem` and `--text-sm`
  at and above it.
- Card, dialog and alert-dialog titles use `--text-base` at their default size
  (the `sm` card uses `--text-sm`); alert, popover, empty and field titles use
  `--text-sm`. Badges, kbd, tooltips and `xs` buttons use `--text-xs`; the `sm`
  button is a deliberate `0.8rem` exception.
- Line heights are paired tokens (`--text-*--line-height`) or explicit unitless
  values where the component needs a tighter title or description rhythm. Code
  Block uses `1.6` for code lines.

### Shadows and icons

- Shadow tokens `--shadow-2xs` through `--shadow-2xl` are available. The
  default style uses a 1px foreground ring shadow for cards and dialogs, and
  that ring plus `--shadow-md` for popovers and menus.
- Icons inherit `currentColor`; components disable pointer events on the
  decorative SVG that sits inside their interaction targets.
- `--icon-size` is a local component variable, not a global token. The
  fallback is `1rem`; button sizes override it to `0.75rem` (`xs`) or
  `0.875rem` (`sm`). Kbd and badge icons are `0.75rem`; the alert-dialog figure
  icon is `1.5rem`. Code Block title icons are `1rem`; its copy and wrap
  controls use the `icon-xs` button size (`0.75rem` icons).

### Spacing

v1 does not expose a spacing token scale. Component spacing uses rem values on
a `0.125rem` grid. Consumers should customize spacing by editing the style
file they own, not by expecting a spacing API.

## Surfaces and state recipes

### Surfaces

| Surface | Treatment |
| --- | --- |
| Page | `--background` / `--foreground`. |
| Card | `--card` surface, 1px foreground-at-10% ring shadow, `--radius-xl`. |
| Alert | `--card` surface, 1px `--border` border, `--radius-lg`; no shadow. |
| Popover, menu, dialog | `--popover` surface, 1px foreground-at-10% ring, `--shadow-md` for popovers/menus, `--radius-lg` or `--radius-xl` by component. |
| Code Block | `--muted` surface, 1px foreground-at-5% ring, `--radius-xl`; no header divider. Destructive uses a destructive tint, text and ring. |
| Muted region | `--muted` at 50% for footers, table footers and subdued rows; `--muted` for skeletons and kbd. |
| Dialog backdrop | Black at 10% plus a 4px backdrop blur. |
| Empty | Dashed `--border` outline, no fill. |

Borders: use `--border` for separators, alerts and outline variants; cards use
a box-shadow ring instead of a border. Use `--input` for the border of text
fields, selects, checkboxes, radios and switches.

### State recipes

| State | Visual rule |
| --- | --- |
| Hover | Primary fills mix toward transparent at 20%; outline and ghost use `--muted`; link underlines; menu items use `--accent`; table rows use muted at 50%. |
| Focus visible | 1px `--ring` border plus a 3px `--ring`-at-50% shadow. Tabs also draw a 1px `--ring` outline; menu items use the accent background instead of a ring. Code Block rings the block while its `pre` is focused. |
| Invalid | `--destructive` border plus a 3px destructive-at-20% shadow; dark mode uses stronger destructive mixes. A field containing an invalid control turns its text destructive. |
| Disabled | 50% opacity. Buttons, tabs and menu items also drop pointer events; inputs, textareas and selects use a not-allowed cursor. |
| Active | Buttons translate down 1px, except triggers with `aria-haspopup`. |
| Selected | Tabs use a raised background and `--shadow-sm`; line tabs use a 2px foreground indicator. Table rows use `--muted`. |
| Highlighted | Menu items use `--accent` / `--accent-foreground`; destructive items use a destructive tint. |
| Expanded | Secondary, outline and ghost buttons keep their open-state fill via `aria-expanded="true"`. |

Forced-colors mode: focusable controls that suppress the native outline draw a
transparent 2px outline with a 2px offset so the system focus indicator remains
visible.

## Layout and sizing

| Element | Default | Variants |
| --- | --- | --- |
| Button | `2rem` high | `xs` 1.5rem, `sm` 1.75rem, `lg` 2.25rem |
| Icon button | `2rem` square | `icon-xs` 1.5rem, `icon-sm` 1.75rem, `icon-lg` 2.25rem |
| Input | `2rem` high | — |
| Native select | `2rem` high | `sm` 1.75rem |
| Textarea | `min-height: 4rem` | Grows with `field-sizing: content` |
| Checkbox, radio | `1rem` square | — |
| Switch | `32 × 18.4px` | `sm`: `24 × 14px` |
| Badge | `1.25rem` high | — |
| Tablist | `2rem` high | Vertical tablists use content height |
| Kbd | `1.25rem` high, `1.25rem` minimum width | — |
| Code Block | No fixed height; the `pre` scrolls | `sm`: `--text-xs`, `0.75rem` padding and `--radius-lg` |

The table describes the default Nova style. Vega raises control heights by
`0.25rem` (input and native select `2.25rem`, buttons `2.25rem`, `lg`
`2.5rem`), uses `--radius-md` for controls, adds `--shadow-xs` to bordered
controls and cards, and gives dialogs `1.5rem` padding. Maia and Luma round
controls further; Lyra and Sera square them; Mira is the densest; Rhea pairs
Luma's soft surfaces with compact controls.

Breakpoints:

- `40rem` (640px): dialog and alert-dialog footer direction, alert-dialog
  header alignment and dialog max width.
- `48rem` (768px): input/textarea type size and description wrapping.
- `28rem` (448px) container query: responsive fields switch from stacked to
  horizontal inside their field group.

Component widths:

- Dialog panel: `24rem` maximum at `40rem` and above.
- Alert dialog panel: `20rem` maximum by default, `24rem` at `40rem` and above;
  `data-size="sm"` keeps `20rem`.
- Popover panel: `18rem`.
- Dropdown menu: at least `8rem`, at least as wide as its trigger.
- Tooltip: `20rem` maximum.
- Empty header, section and footer: `24rem` maximum.
- Cards, items and code blocks have no fixed width; consumers set their layout
  width. Code Block content scrolls horizontally unless `data-wrap` is present.

Directionality: layout uses logical properties. RTL-specific rules exist for
the switch thumb, native-select chevron, popover/tooltip placement and
`[data-rtl-flip]` icons in menus. Code Block content is always `dir="ltr"` even
on an RTL page; its header follows the page direction.

## Public component API

### Roots and anatomy

| Component | Root classes | Anatomy | Public modifiers |
| --- | --- | --- | --- |
| Alert | `.alert` | Direct SVG icon; title (`h2`–`h6`, `strong` or `[data-slot="title"]`); description (`[data-slot="description"]` or `section`); action (`footer`). | `data-variant="destructive"`; default by omission |
| Alert dialog | `.alert-dialog` | Native `<dialog>` containing a panel; panel contains `header` (optional `figure`), title, description, `section` and `footer`. | `data-size="sm"` on the dialog or panel; default by omission |
| Badge | `.badge` | Text and optional SVG. | `data-variant="primary|secondary|outline|destructive|ghost|link"` |
| Button | `.btn` | Text and optional SVG; `data-icon="inline-start|inline-end"` marks inline icons for padding. | `data-variant="default|primary|secondary|outline|destructive|ghost|link"`; `data-size="default|xs|sm|lg|icon|icon-xs|icon-sm|icon-lg"` |
| Button group | `.btn-group` | Buttons, inputs, dropdown/popover wrappers, `span`/`label`/`output` and `hr[role="separator"]`. | `data-orientation="horizontal|vertical"` |
| Card | `.card` | `header` with title/description/action, `section`, `footer`, optional leading/trailing image. | `data-size="default|sm"`; `data-separator="bottom"` on the header |
| Checkbox | `.checkbox` | Native `input[type="checkbox"]`; must not carry `role="switch"`. | — |
| Code Block | `.code-block` | Optional `header` with `[data-slot="title"]` and `[data-slot="actions"]`; required `pre` containing `code`; optional `footer`; line parts `[data-slot="line"]` wrapping `[data-slot="line-content"]`. | `data-size="default|sm"`; `data-variant="default|destructive"`; `pre` `data-line-numbers`, `data-wrap`, `--line-start`; line `data-variant="added|removed|highlighted"` |
| Dialog | `.dialog` | Native `<dialog>` containing a panel; panel contains `header`, title, description, `section`, `footer` and a close button or `form[method="dialog"]`. | — |
| Dropdown menu | `.dropdown-menu` | Trigger, `[data-popover]` panel, `[role="menu"]`, menu item roles, `[role="separator"]`, `[role="heading"]`, shortcut and indicator slots. | Item `data-variant="destructive"`; default by omission; placement attributes; `data-inset`; `data-rtl-flip` |
| Empty | `.empty` | `header` with `figure`, title and description; `section`; `footer`. | — |
| Field | `.field`, `.fieldset` | Label or legend, control, description `p`, error `[role="alert"]`, group/radiogroup container and `.field-separator`. | Legend `data-variant="label|legend"`; field `data-orientation="horizontal|responsive"`; group `data-slot="checkbox-group|radio-group"` |
| Input | `.input` | Native `<input>`. | — |
| Item | `.item`, `.item-group` | `figure`, `section`, `aside`, `header`, `footer`; item groups accept `hr` separators. | Item `data-variant="default|outline|muted"`; `data-size="default|sm|xs"` |
| Kbd | `.kbd` | Inline shortcut text or SVG. | — |
| Label | `.label` | Native `<label>`; also supported as a direct label inside `.field`. | — |
| Native select | `.native-select` | Native `<select>`. | `data-size="sm"`; default by omission |
| Popover | `.popover` | Trigger and `[data-popover]` panel with optional header, title and description. | Placement attributes |
| Radio | `.radio` | Native `input[type="radio"]`, normally inside `role="radiogroup"`. | — |
| Skeleton | `.skeleton` | No required children; the consumer sets dimensions. | — |
| Switch | `.switch` | Native `input[type="checkbox"]` with `role="switch"` and a label. | `data-size="default|sm"` |
| Table | `.table-container`, `.table` | `caption`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`; checkbox cells use `role="checkbox"`. | Row `aria-selected="true"` |
| Tabs | `.tabs` | `[role="tablist"]`, `[role="tab"]`, `[role="tabpanel"]`. | Tablist `data-variant="default|line"`; `aria-orientation="horizontal|vertical"` |
| Textarea | `.textarea` | Native `<textarea>`. | — |
| Tooltip | `.tooltip[data-tooltip]` | Pseudo-element content from `data-tooltip`; optional arrow. | `data-side`, `data-align`, `data-arrow` |

On buttons, `default` and `primary` are aliases; omitting `data-variant` is
the same as `primary`. On badges, `primary` and omission are equivalent and
`default` is not a badge value. Other components define their own default by
omission.

Card also accepts the compatibility aliases `.card-title`, `.card-description`
and `.card-action`; prefer the `data-slot` names in new markup.

### Parts and slots

The public slot vocabulary is shared across components:

- `data-slot="title"` — alert, card, code block, dialog, alert-dialog, popover.
- `data-slot="description"` — alert, card, dialog, alert-dialog, popover.
- `data-slot="action"` — card.
- `data-slot="actions"` — code block.
- `data-slot="line"`, `data-slot="line-content"` — code block.
- `data-slot="header"` — popover.
- `data-slot="shortcut"` — dropdown menu.
- `data-slot="indicator"` — dropdown menu.
- `data-slot="checkbox-group"`, `data-slot="radio-group"` — field.

Semantic parts are equally public where documented: `header`, `section`,
`footer`, `figure`, `aside`, `pre`, `code`, `[role="menu"]`, `[role="tablist"]`,
`[role="tab"]` and `[role="tabpanel"]`. Do not invent a new `data-slot` name for
a part that already has a semantic element in the anatomy.

### Placement attributes

Popover panels, dropdown panels and tooltips share placement hooks:

| Attribute | Values | Default | Applies to |
| --- | --- | --- | --- |
| `data-side` | `top`, `bottom`, `left`, `right`, `inline-start`, `inline-end` | `bottom` for popover/dropdown, `top` for tooltip | Popover, dropdown and tooltip |
| `data-align` | `start`, `center`, `end` | `start` | Popover, dropdown and tooltip |
| `data-arrow` | Present or absent | No arrow | Tooltip |

Physical sides (`left`/`right`) and logical sides (`inline-start`/`inline-end`)
are both supported. `center` alignment uses a translate offset. `data-inset`
adds leading padding to menu items and headings; `data-rtl-flip` rotates an
icon 180 degrees in RTL contexts.

`data-orientation` is component-specific: `horizontal|vertical` on button
groups and tablists, `horizontal|responsive` on fields. Do not assume one
value set applies everywhere.

## State contract

Components style state from native pseudo-classes and ARIA. These are the only
public state hooks:

| State | Public expression | Applies to |
| --- | --- | --- |
| Invalid | `aria-invalid="true"` | Inputs, textareas, native selects, checkbox, radio, switch, buttons, badges and `.field` (including descendants). |
| Disabled | Native `:disabled` | Buttons, inputs, textareas, selects, menu items and native controls. |
| Disabled, non-native | `aria-disabled="true"` | Tabs, menu items and other elements that cannot use `:disabled`. |
| Selected | `aria-selected="true"` | Tabs and selectable table rows. |
| Checked, native | `:checked` | Checkbox, radio and switch. |
| Checked, menu item | `aria-checked="true"` | `menuitemcheckbox` and `menuitemradio`. |
| Highlighted | `data-highlighted` | Menu items. Presence only; no value required. |
| Open, dialog | Native `[open]` | Dialog and alert dialog. |
| Open, popover | `aria-hidden="false"` | `[data-popover]` panels; the trigger uses `aria-expanded`. |
| Focus | `:focus-visible` | All focusable controls. |

The state contract is deliberately small. Do **not** use `.active`,
`data-active`, `data-invalid`, `data-disabled`, `data-selected`,
`data-state="selected"` or similar class/data aliases. Beyond variant, size and
placement attributes, `data-highlighted` is the only public data-driven state;
any other state must be expressible with a native pseudo-class or ARIA.

Notes:

- `aria-hidden="true"` hides a popover and drives its exit transform. The
  dialog shell also recognizes `:popover-open` for consumers using the native
  popover API, but the documented dialog pattern is `<dialog>` plus `[open]`.
- `aria-expanded="true"` is the trigger state for popovers, dropdown menus and
  buttons that open an overlay.
- `data-dropdown-menu-initialized` is an internal behavior hook used to
  disable the CSS-only hover fallback once JavaScript takes over keyboard
  navigation. It is not part of the public state contract.
- The CSS-only tooltip shows on `:hover` and `:focus-visible`; it has no
  JavaScript open state.
- Code Block's `data-line-numbers`, `data-wrap` and line `data-variant` are
  presentation modifiers, not states. `--line-start` on the `pre` is a local
  customization property, not a global token.

## Motion

- Standard easing is `cubic-bezier(0.4, 0, 0.2, 1)`.
- Controls, hover states, tabs, table rows and tooltips transition in `150ms`.
- Code Block's floating actions fade in `150ms` on hover and focus-within.
- Overlays (popover, dropdown, dialog, alert dialog) transition in `100ms`;
  the underlying shell defaults to `150ms` when a style does not override it.
- Item hover and state transitions use `100ms`; the skeleton pulses on a `2s`
  loop with `cubic-bezier(0.4, 0, 0.6, 1)`.
- Dialog entry uses `@starting-style` and `allow-discrete`: the backdrop fades,
  the panel moves from 95% to 100% scale with opacity.
- Popovers scale from 95% and move `0.5rem` from their placement side. Menus
  and popovers fade with `visibility`.
- Tooltips fade with `visibility` on hover and focus; their `0.5rem` placement
  offsets are static. Their pseudo-element is currently held at 95% scale, so
  the tooltip does not scale in (see Known gaps).
- Motion is primarily opacity, scale and translate. There are no springs,
  bounces or attention-seeking loops beyond the skeleton.

v1 has no `prefers-reduced-motion` guard. This is a known gap, not an
intentional exclusion.

## Accessibility

- Native elements are preferred: `<button>`, `<input>`, `<select>`,
  `<textarea>`, `<dialog>` and `<table>`. ARIA roles are used for composite
  widgets that have no native equivalent (`tablist`, `tab`, `menu`,
  `menuitem`, `radiogroup`).
- Every interactive component must be operable by keyboard and expose its
  state through the contract above. loseta provides styling only; the
  consumer provides behavior.
- Dialogs must be labelled with `aria-labelledby` and, when the description is
  present, `aria-describedby`. Use `showModal()` and `close()`.
- Tabs must maintain `aria-selected`, `hidden` on inactive panels and roving
  `tabindex`; CSS does not switch panels.
- Code Block must keep its content `dir="ltr"` and focusable through
  `tabindex="0"`; line numbers and diff markers are generated content and are
  excluded from selection. Copy controls need an accessible label and a
  consumer-managed announcement; a wrap toggle uses `aria-pressed`.
- Dropdown menus must maintain `aria-expanded` on the trigger,
  `aria-hidden` on the panel and roving focus; checkable items use
  `aria-checked`.
- Popovers must maintain `aria-expanded` on the trigger and `aria-hidden` on
  the panel.
- Tooltips must have an accessible name or description on the trigger; the
  visual bubble is generated from `data-tooltip` and is not a substitute for
  `aria-label` or `aria-describedby`.
- Components that suppress the native outline provide a visible replacement
  in the documented markup; the dialog close button must carry `.btn` (or an
  equivalent focus style). The default focus ring is a 1px `--ring` border plus a
  3px 50% ring shadow; forced-colors mode restores a transparent 2px outline
  for system focus rendering.
- CI runs axe with `wcag2a`, `wcag2aa`, `wcag21a` and `wcag21aa` on every docs
  page in light and dark mode, in Chromium and WebKit, and fails on `serious`
  or `critical` violations. This is a floor, not a substitute for manual
  testing.

## Distribution and change policy

Install targets:

| Item kind | Base file | Style file |
| --- | --- | --- |
| Foundation | `tokens.css`, `reset.css`, `base.css`, `utilities.css` | — |
| Primitive | `primitives/<name>.css` | `styles/<style>/primitives/<name>.css` |
| Component | `components/<name>.css` | `styles/<style>/<name>.css` |

The CLI writes these under the configured CSS directory (default
`src/styles/loseta`), records them in `.loseta/manifest.json`, and regenerates
`index.css` with the fixed layer declaration and imports. `loseta.json` holds
the CSS directory, entrypoint and style. The default style is Nova.

Registry dependencies are hard: installing `dialog` or `alert-dialog` also
installs `dialog-shell`; installing `dropdown-menu` or `popover` also installs
`popover-primitive`. Optional dependencies are composition hints only and are
never installed automatically. Notable optional pairs are field with its form
controls, button group with button/input/popover/dropdown-menu, table with
checkbox, dropdown-menu with kbd, and code block with button for copy and wrap
controls.

### Compatibility contract

The following are public API and require a breaking-change note when changed:

- root classes and documented install targets;
- public slots and documented semantic parts;
- variant, size, orientation and placement attribute names and values;
- the state contract;
- token names and their semantic roles;
- the declared style names and their install targets;
- the fixed layer order and the meaning of each layer;
- documented anatomy requirements and optional/required children.

Additive changes (a new optional part, a new variant, a new token with a
fallback) are non-breaking. Visual refinements that preserve anatomy and API
are normal style work, but they must keep contrast and focus visibility.

Because distribution is copy-paste, installed files do not update
automatically. Consumers receive changes only by installing or re-adding
files. Local edits are outside the contract and should be treated as a fork.

Until 1.0, the registry is explicitly pre-stable: breaking changes are still
possible, but every one must be called out in [`CHANGELOG.md`](CHANGELOG.md)
and reflected in this baseline. After 1.0, the compatibility contract follows
semantic versioning.

## Known gaps

- No `prefers-reduced-motion` guard.
- Tooltip entry only fades; the pseudo-element remains at 95% scale instead of
  animating to 100%.
- Nova, Vega, Maia, Lyra, Mira, Luma, Sera and Rhea are the only shipped
  styles; style-specific visual regression snapshots are not part of CI.
- No JavaScript behavior is shipped. Dialogs, popovers, dropdown menus, tabs
  and Code Block copy/wrap controls require consumer code.
- Code Block does not ship syntax highlighting, ANSI rendering, streaming or a
  Show More interaction; syntax highlighting stays in the consumer's
  highlighter and line numbers/diff/highlights require explicit line markup.
- No visual regression snapshots. CI covers axe and functional docs behavior,
  not pixel diffs, forced-colors rendering or RTL layouts.
- Experimental items are outside this contract and are not published.
- There is no spacing or motion token scale; spacing and durations are
  component-level values.
- The button group retains composition hooks for an experimental `.select`;
  that selector is not part of the stable v1 registry.
- Browser support is limited to the modern fidelity target above; there is no
  legacy fallback layer.
