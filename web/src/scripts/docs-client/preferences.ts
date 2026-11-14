export const COLOR_SCHEMES = ["system", "light", "dark"] as const;
export type ColorScheme = (typeof COLOR_SCHEMES)[number];

export const PACKAGE_MANAGERS = ["pnpm", "npm"] as const;
export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

export interface Preferences {
  scheme: ColorScheme;
  packageManager: PackageManager;
}

const STORAGE_KEYS: Record<keyof Preferences, string> = {
  scheme: "scheme",
  packageManager: "package-manager"
};

const DEFAULT_PREFERENCES: Preferences = {
  scheme: "system",
  packageManager: "pnpm"
};

export function isColorScheme(
  value: string | null | undefined
): value is ColorScheme {
  return (
    value !== null &&
    value !== undefined &&
    (COLOR_SCHEMES as readonly string[]).includes(value)
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
    const scheme = localStorage.getItem(STORAGE_KEYS.scheme);
    const packageManager = localStorage.getItem(STORAGE_KEYS.packageManager);
    return {
      scheme: isColorScheme(scheme) ? scheme : DEFAULT_PREFERENCES.scheme,
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
    preferences.scheme === "dark" ||
    (preferences.scheme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  root.classList.toggle("dark", dark);
  root.dataset.js = "true";
  root.dataset.scheme = preferences.scheme;
  root.dataset.packageManager = preferences.packageManager;
}
