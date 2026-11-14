export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const PACKAGE_MANAGERS = ["pnpm", "npm"] as const;
export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

export interface Preferences {
  theme: Theme;
  packageManager: PackageManager;
}

const STORAGE_KEYS: Record<keyof Preferences, string> = {
  theme: "theme",
  packageManager: "package-manager"
};

const DEFAULT_PREFERENCES: Preferences = {
  theme: "system",
  packageManager: "pnpm"
};

export function isTheme(value: string | null | undefined): value is Theme {
  return (
    value !== null && value !== undefined && (THEMES as readonly string[]).includes(value)
  );
}

export function isPackageManager(
  value: string | null | undefined
): value is PackageManager {
  return (
    value !== null &&
    value !== undefined &&
    (PACKAGE_MANAGERS as readonly string[]).includes(value)
  );
}

export function readPreferences(): Preferences {
  try {
    const theme = localStorage.getItem(STORAGE_KEYS.theme);
    const packageManager = localStorage.getItem(STORAGE_KEYS.packageManager);
    return {
      theme: isTheme(theme) ? theme : DEFAULT_PREFERENCES.theme,
      packageManager: isPackageManager(packageManager)
        ? packageManager
        : DEFAULT_PREFERENCES.packageManager
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function updatePreference<K extends keyof Preferences>(
  key: K,
  value: Preferences[K]
): Preferences {
  const next = { ...readPreferences(), [key]: value };
  try {
    localStorage.setItem(STORAGE_KEYS[key], value);
  } catch {
    // Storage can be unavailable; the current page still reflects the change.
  }
  return next;
}

export function applyPreferences(
  root: HTMLElement,
  preferences: Preferences = readPreferences()
): void {
  const dark =
    preferences.theme === "dark" ||
    (preferences.theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  root.classList.toggle("dark", dark);
  root.dataset.theme = preferences.theme;
  root.dataset.packageManager = preferences.packageManager;
}
