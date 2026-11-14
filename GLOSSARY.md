# loseta

loseta is a copy-paste registry of native CSS component styles with a documented markup contract. This glossary fixes the vocabulary used across the registry, the CLI, the documentation and the CSS itself.

## Distribution

**Registry**:
The catalog of installable CSS items that the CLI reads and writes into a project.
_Avoid_: package, bundle, library

**Item**:
One named entry in the registry with its own files, root selectors and dependency metadata.
_Avoid_: entry, module, asset

**Copy-paste distribution**:
A delivery model in which installed files become part of the consumer's project and can be edited freely.
_Avoid_: dependency install, runtime import

**Install target**:
The location inside the consumer's CSS directory where an item file is written.
_Avoid_: output path, destination

**CSS directory**:
The consumer-owned directory that receives all installed files.
_Avoid_: output folder, build directory

**Manifest**:
The record of installed items and file hashes that tracks what the CLI has written.
_Avoid_: lockfile, state file

**Generated entrypoint**:
The stylesheet the CLI regenerates from the manifest to declare layer order and import installed files.
_Avoid_: bundle, main stylesheet

## Item kinds

**Foundation**:
An item that provides a global prerequisite shared by every component, such as tokens, reset, base defaults or utilities.
_Avoid_: core, globals

**Primitive**:
An internal item installed automatically to provide shared structure for one or more public components.
_Avoid_: base component, helper, utility component

**Component**:
A public UI element with its own root class, structural file and theme file.
_Avoid_: widget, block, element

**Theme**:
The visual interpretation of the system; Nova is the only theme shipped in v1.
_Avoid_: skin, preset

**Nova**:
The default and reference visual theme of loseta.
_Avoid_: default style, skin

## Architecture

**Base file**:
The structural half of an item: markup expectations, layout and behavior hooks.
_Avoid_: core CSS, style file

**Theme file**:
The visual half of an item: color, typography, spacing and surface treatment.
_Avoid_: override, skin

**Layer**:
One of the fixed, namespaced cascade layers that order tokens, reset, base, components, theme and utilities.
_Avoid_: level, tier

**Token**:
A named design decision expressed as a CSS custom property and reused across components.
_Avoid_: variable, constant

**Color role**:
A semantic token that describes intent rather than a literal color, such as background, primary, muted or destructive.
_Avoid_: palette entry, color name

**Registry dependency**:
A hard dependency that the CLI installs automatically because the item cannot work without it.
_Avoid_: peer dependency, required package

**Optional dependency**:
An item that composes well with another item but is never installed automatically.
_Avoid_: suggested dependency, nice-to-have

**Composition**:
Using items together in markup without requiring CSS coupling between them.
_Avoid_: inheritance, extension

## Public API

**Root class**:
The class on a component's outermost element that scopes all of its styles.
_Avoid_: wrapper class, component selector

**Part**:
An element inside a component that has a named role in the markup contract and can be styled independently.
_Avoid_: subcomponent, child class

**Slot**:
The public name that identifies a part, shared across components with the same anatomy.
_Avoid_: role, region

**Variant**:
A named visual alternative of a component.
_Avoid_: type, kind, style, modifier

**Size**:
A named dimension preset of a component.
_Avoid_: scale, density

**State contract**:
The documented set of platform states and ARIA attributes through which a component's interaction and validation state is expressed.
_Avoid_: state API, props

**Highlighted**:
The transient highlight on the item a menu is about to activate through keyboard or pointer.
_Avoid_: active, hovered, focused

**Selected**:
A persistent choice in a selection widget.
_Avoid_: active, current

**Invalid**:
A control that has failed validation.
_Avoid_: error, data-invalid

**Disabled**:
A control that cannot be operated.
_Avoid_: inactive, data-disabled

## Maturity

**Stable**:
Covered by the public compatibility contract, documented and included when installing all stable components.
_Avoid_: production-ready, GA

**Experimental**:
Available for exploration but outside the v1 compatibility contract and not published.
_Avoid_: beta, preview, draft

## Documentation

**Design baseline**:
The durable contract for visual language, component API, accessibility and compatibility that the registry promises to keep stable.
_Avoid_: style guide, design system docs

**Example**:
A canonical HTML fragment shipped with an item and rendered in the docs.
_Avoid_: demo, snippet, sample

**Docs client**:
The browser-side module of the docs site that applies stored preferences and mounts per-page behavior across client-side navigation.
_Avoid_: docs runtime, docs shell
