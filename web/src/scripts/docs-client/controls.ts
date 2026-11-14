import {
  applyPreferences,
  isPackageManager,
  isTheme,
  readPreferences,
  updatePreference
} from "./preferences";
import type { PageBehavior } from "./lifecycle";

const syncButtons = (): void => {
  const { theme, packageManager } = readPreferences();

  document.querySelectorAll<HTMLElement>("[data-theme-value]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.themeValue === theme));
  });

  document
    .querySelectorAll<HTMLElement>("[data-package-manager-value]")
    .forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.packageManagerValue === packageManager)
      );
    });
};

const applyCurrentPreferences = (): void => {
  applyPreferences(document.documentElement);
  syncButtons();
};

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;

  const themeButton = event.target.closest("[data-theme-value]");
  if (themeButton) {
    const value = themeButton.getAttribute("data-theme-value");
    if (isTheme(value)) {
      updatePreference("theme", value);
      applyCurrentPreferences();
    }
    return;
  }

  const managerButton = event.target.closest("[data-package-manager-value]");
  if (managerButton) {
    const value = managerButton.getAttribute("data-package-manager-value");
    if (isPackageManager(value)) {
      updatePreference("packageManager", value);
      applyCurrentPreferences();
    }
  }
});

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (readPreferences().theme === "system") {
    applyPreferences(document.documentElement);
  }
});

export const controls: PageBehavior = {
  mount: syncButtons
};
