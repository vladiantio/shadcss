import type { PageBehavior } from "./lifecycle";

const setExpanded = (card: HTMLElement, expanded: boolean): void => {
  const source = card.querySelector<HTMLElement>("[data-preview-source]");
  const toggle = card.querySelector<HTMLButtonElement>("[data-preview-toggle]");
  const pre = source?.querySelector<HTMLPreElement>("pre");

  if (expanded) {
    card.setAttribute("data-code-open", "true");
    toggle?.setAttribute("aria-expanded", "true");
    source?.removeAttribute("aria-hidden");
    pre?.setAttribute("tabindex", "0");
    pre?.focus({ preventScroll: true });
    return;
  }

  card.removeAttribute("data-code-open");
  toggle?.setAttribute("aria-expanded", "false");
  source?.setAttribute("aria-hidden", "true");
  pre?.setAttribute("tabindex", "-1");
};

const syncCollapsedPreviews = (): void => {
  document
    .querySelectorAll<HTMLElement>("[data-component-preview]:not([data-code-open])")
    .forEach((card) => setExpanded(card, false));
};

const onClick = (event: MouseEvent): void => {
  if (!(event.target instanceof Element)) return;

  const toggle = event.target.closest("[data-preview-toggle]");
  if (!toggle) return;

  const card = toggle.closest<HTMLElement>("[data-component-preview]");
  if (!card) return;

  setExpanded(card, true);
};

export const componentPreview: PageBehavior = {
  mount() {
    syncCollapsedPreviews();
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }
};
