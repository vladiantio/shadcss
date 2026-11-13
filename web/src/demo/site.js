const packageManagers = ["pnpm", "npm"];

const applyPackageManager = (value) => {
  const manager = packageManagers.includes(value) ? value : "pnpm";
  document.documentElement.dataset.packageManager = manager;
  document.querySelectorAll("[data-package-manager-value]").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.getAttribute("data-package-manager-value") === manager)
    );
  });
};

applyPackageManager(document.documentElement.dataset.packageManager);

const closeAllPopovers = (except) => {
  document.querySelectorAll("[data-demo] [data-popover]").forEach((popover) => {
    if (popover === except) return;
    popover.setAttribute("aria-hidden", "true");
    const trigger = popover.closest("[data-demo]")?.querySelector("[data-demo-trigger]");
    trigger?.setAttribute("aria-expanded", "false");
  });
};

document.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const copy = target.closest("[data-copy]");
  if (copy) {
    const block = copy.closest(".code-block, .install-command");
    const manager = document.documentElement.dataset.packageManager ?? "pnpm";
    const code =
      block?.querySelector(`[data-package-manager-panel="${manager}"] code`) ??
      block?.querySelector("code");
    if (code) {
      try {
        await navigator.clipboard.writeText(code.textContent ?? "");
        const iconCopy = copy.hasAttribute("data-copy-icon");
        const previousText = copy.textContent;
        const previousLabel = copy.getAttribute("aria-label");
        if (iconCopy) {
          copy.setAttribute("data-copied", "true");
          copy.setAttribute("aria-label", "Copied");
        } else {
          copy.textContent = "Copied";
        }
        setTimeout(() => {
          if (iconCopy) {
            copy.removeAttribute("data-copied");
            if (previousLabel) copy.setAttribute("aria-label", previousLabel);
          } else {
            copy.textContent = previousText;
          }
        }, 1500);
      } catch {
        // Clipboard access can be blocked; leaving the label untouched is fine.
      }
    }
    return;
  }

  const packageManager = target.closest("[data-package-manager-value]");
  if (packageManager) {
    const value = packageManager.getAttribute("data-package-manager-value");
    if (packageManagers.includes(value)) {
      applyPackageManager(value);
      try {
        localStorage.setItem("package-manager", value);
      } catch {
        // Storage can be unavailable; the switch still works for this page.
      }
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
      tabs.querySelectorAll('[role="tab"]').forEach((item) => {
        const selected = item === tab;
        item.setAttribute("aria-selected", selected ? "true" : "false");
        item.setAttribute("tabindex", selected ? "0" : "-1");
      });
      tabs.querySelectorAll('[role="tabpanel"]').forEach((panel) => {
        panel.hidden = panel.id !== tab.getAttribute("aria-controls");
      });
    }
    return;
  }

  if (!target.closest("[data-demo]")) {
    closeAllPopovers();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAllPopovers();
    document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
  }
});
