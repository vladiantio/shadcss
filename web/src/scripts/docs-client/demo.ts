const announce = (message: string): void => {
  let region = document.querySelector("[data-copy-status]");
  if (!region) {
    region = document.createElement("span");
    region.setAttribute("data-copy-status", "");
    region.setAttribute("role", "status");
    region.className = "sr-only";
    document.body.append(region);
  }
  region.textContent = "";
  requestAnimationFrame(() => {
    region.textContent = message;
  });
};

const closeAllPopovers = (except?: Element): void => {
  document.querySelectorAll("[data-demo] [data-popover]").forEach((popover) => {
    if (popover === except) return;
    popover.setAttribute("aria-hidden", "true");
    const trigger = popover.closest("[data-demo]")?.querySelector("[data-demo-trigger]");
    trigger?.setAttribute("aria-expanded", "false");
  });
};

const onClick = async (event: MouseEvent): Promise<void> => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const copy = target.closest("[data-copy], [data-demo-copy]");
  if (copy) {
    const block = copy.closest(".code-block, .install-command");
    const manager = document.documentElement.dataset.packageManager ?? "pnpm";
    const code =
      block?.querySelector(`[data-package-manager-panel="${manager}"] code`) ??
      block?.querySelector("code");
    if (code) {
      try {
        const lines = code.querySelectorAll("[data-slot='line']");
        const text =
          lines.length > 0
            ? Array.from(lines, (line) => line.textContent ?? "").join("\n")
            : code instanceof HTMLElement
              ? code.innerText
              : (code.textContent ?? "");
        await navigator.clipboard.writeText(text);
        const iconCopy = copy.hasAttribute("data-copy-icon") || Boolean(copy.querySelector("svg"));
        const previousText = copy.textContent;
        const previousLabel = copy.getAttribute("aria-label");
        if (iconCopy) {
          copy.setAttribute("data-copied", "true");
          copy.setAttribute("aria-label", "Copied");
        } else {
          copy.textContent = "Copied";
        }
        announce("Copied");
        setTimeout(() => {
          if (iconCopy) {
            copy.removeAttribute("data-copied");
            if (previousLabel) copy.setAttribute("aria-label", previousLabel);
          } else {
            copy.textContent = previousText;
          }
        }, 1500);
      } catch {
        announce("Copy failed");
      }
    }
    return;
  }

  const wrap = target.closest("[data-demo-wrap]");
  if (wrap) {
    const block = wrap.closest('[data-demo="code-block"]');
    const pre = block?.querySelector("pre");
    if (pre) {
      const next = !pre.hasAttribute("data-wrap");
      pre.toggleAttribute("data-wrap", next);
      wrap.setAttribute("aria-pressed", String(next));
    }
    return;
  }

  const open = target.closest("[data-open-dialog]");
  if (open) {
    const dialog = document.getElementById(open.getAttribute("data-open-dialog") ?? "");
    if (dialog instanceof HTMLDialogElement) dialog.showModal();
    return;
  }

  const close = target.closest("[data-close-dialog]");
  if (close) {
    const dialog = close.closest("dialog");
    if (dialog instanceof HTMLDialogElement) dialog.close();
    return;
  }

  const trigger = target.closest("[data-demo-trigger]");
  if (trigger) {
    const root = trigger.closest("[data-demo]");
    const popover = root?.querySelector("[data-popover]");
    if (popover) {
      const willOpen = popover.getAttribute("aria-hidden") === "true";
      closeAllPopovers(popover);
      popover.setAttribute("aria-hidden", willOpen ? "false" : "true");
      trigger.setAttribute("aria-expanded", willOpen ? "true" : "false");
    }
    return;
  }

  const tab = target.closest('[role="tab"]');
  if (tab) {
    const tabs = tab.closest(".tabs");
    if (tabs) {
      tabs.querySelectorAll<HTMLElement>('[role="tab"]').forEach((item) => {
        const selected = item === tab;
        item.setAttribute("aria-selected", selected ? "true" : "false");
        item.setAttribute("tabindex", selected ? "0" : "-1");
      });
      tabs.querySelectorAll<HTMLElement>('[role="tabpanel"]').forEach((panel) => {
        panel.hidden = panel.id !== tab.getAttribute("aria-controls");
      });
    }
    return;
  }

  if (!target.closest("[data-popover], [data-demo-trigger]")) {
    closeAllPopovers();
  }
};

const onKeyDown = (event: KeyboardEvent): void => {
  if (event.key === "Escape") {
    closeAllPopovers();
    document.querySelectorAll<HTMLDialogElement>("dialog[open]").forEach((dialog) => {
      dialog.close();
    });
  }
};

let mounted = false;

/** Demo-only interactions. Registered once; the docs client never re-mounts it. */
export function mountDemo(): void {
  if (mounted) return;
  mounted = true;
  document.addEventListener("click", onClick);
  document.addEventListener("keydown", onKeyDown);
}
