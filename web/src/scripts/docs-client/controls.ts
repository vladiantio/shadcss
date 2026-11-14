import {
  applyPreferences,
  isColorScheme,
  isPackageManager,
  readPreferences,
  updatePreference
} from "./preferences";
import type { PageBehavior } from "./lifecycle";

const syncButtons = (): void => {
  const { scheme, packageManager } = readPreferences();

  document.querySelectorAll<HTMLElement>("[data-scheme-value]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.schemeValue === scheme));
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

  const schemeButton = event.target.closest("[data-scheme-value]");
  if (schemeButton) {
    const value = schemeButton.getAttribute("data-scheme-value");
    if (isColorScheme(value)) {
      updatePreference("scheme", value);
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
  if (readPreferences().scheme === "system") {
    applyPreferences(document.documentElement);
  }
});

export const controls: PageBehavior = {
  mount: syncButtons
};

// The deferred module runs after the header exists; sync before the page-load
// mount so the stored choice is reflected as early as possible.
syncButtons();
