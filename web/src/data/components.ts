import registry from "../../../packages/loseta/registry/registry.json" with { type: "json" };
import { examples } from "./examples";

export type ComponentGroup = "Forms" | "Surfaces" | "Overlays" | "Disclosure";

const groupBy: Record<string, ComponentGroup> = {
  button: "Forms",
  "button-group": "Forms",
  checkbox: "Forms",
  field: "Forms",
  input: "Forms",
  label: "Forms",
  "native-select": "Forms",
  radio: "Forms",
  switch: "Forms",
  textarea: "Forms",
  alert: "Surfaces",
  badge: "Surfaces",
  card: "Surfaces",
  empty: "Surfaces",
  item: "Surfaces",
  kbd: "Surfaces",
  skeleton: "Surfaces",
  table: "Surfaces",
  "alert-dialog": "Overlays",
  dialog: "Overlays",
  "dropdown-menu": "Overlays",
  popover: "Overlays",
  tooltip: "Overlays",
  tabs: "Disclosure"
};

const notesBy: Record<string, string> = {
  button:
    "Use data-variant and data-size for the public variants. aria-invalid and aria-expanded are supported states.",
  "button-group":
    "Composition is semantic: the CSS does not require .btn, but the examples use it so the group looks like buttons.",
  card: "Use data-slot=\"title\", \"description\" and \"action\" for parts. data-separator=\"bottom\" adds a header divider.",
  checkbox: "The .checkbox class is required. Use native checked/disabled and aria-invalid=\"true\".",
  dialog:
    "Uses native <dialog>. CSS only handles presentation; call showModal() and close() from your JavaScript.",
  "alert-dialog":
    "Uses native <dialog>. CSS only handles presentation; call showModal() and close() from your JavaScript.",
  "dropdown-menu":
    "Requires JavaScript for open/close and keyboard navigation. Toggle aria-hidden on [data-popover] and aria-expanded on the trigger.",
  popover:
    "Requires JavaScript for open/close. Toggle aria-hidden on [data-popover] and aria-expanded on the trigger.",
  tabs:
    "Requires JavaScript to switch aria-selected and the hidden attribute. CSS styles the visual states.",
  tooltip:
    "CSS-only: visible on hover and focus-visible. Use data-arrow for the pointer arrow and data-side/data-align to place it. Keep an aria-label or aria-describedby for screen readers.",
  field: "Use aria-invalid=\"true\" on the control and role=\"alert\" for error messages.",
  table: "Use aria-selected=\"true\" on selectable rows.",
  input: "Use aria-invalid=\"true\" for the invalid state.",
  textarea: "Use aria-invalid=\"true\" for the invalid state.",
  "native-select":
    ".native-select is the native select root. The custom Select is experimental and is not part of v1.",
  switch: "Use input type=\"checkbox\" role=\"switch\" together with the .switch class.",
  radio: "Use .radio and a role=\"radiogroup\" container.",
  label: "Use .label or a native <label> inside .field.",
  empty: "Uses header/figure/section/footer structure.",
  item: "Uses figure/section/aside/header/footer structure.",
  kbd: "Use .kbd inside menus, tooltips or shortcut hints.",
  skeleton: "Set width and height inline or with your own layout classes.",
  alert: "Use role=\"alert\" for dynamic messages."
};

export interface ComponentDoc {
  id: string;
  title: string;
  description: string;
  group: ComponentGroup;
  status: string;
  deps: string[];
  optional: string[];
  files: {
    path: string;
    target: string;
    role: string;
    layer: string;
  }[];
  examples: {
    title: string;
    html: string;
  }[];
  notes: string[];
}

export const components: ComponentDoc[] = registry.items
  .filter((item) => item.type === "component" && item.status === "stable")
  .map((item) => ({
    id: item.name,
    title: item.title,
    description: item.description,
    group: groupBy[item.name] ?? "Surfaces",
    status: item.status,
    deps: item.registryDependencies ?? [],
    optional: item.optionalDependencies ?? [],
    files: item.files,
    examples: examples[item.name] ?? [],
    notes: notesBy[item.name] ? [notesBy[item.name]] : []
  }))
  .sort((a, b) => a.title.localeCompare(b.title));

export const componentGroups: ComponentGroup[] = [
  "Forms",
  "Surfaces",
  "Overlays",
  "Disclosure"
];

export function getComponent(id: string): ComponentDoc | undefined {
  return components.find((component) => component.id === id);
}

export function componentsInGroup(group: ComponentGroup): ComponentDoc[] {
  return components.filter((component) => component.group === group);
}
