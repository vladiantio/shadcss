const themes = ["system", "light", "dark"];
const packageManagers = ["pnpm", "npm"];

const getTheme = () => {
  try {
    const stored = localStorage.getItem("theme");
    return themes.includes(stored) ? stored : "system";
  } catch {
    return "system";
  }
};

const getPackageManager = () => {
  try {
    const stored = localStorage.getItem("package-manager");
    return packageManagers.includes(stored) ? stored : "pnpm";
  } catch {
    return "pnpm";
  }
};

const applyTheme = (root, theme) => {
  root.classList.toggle(
    "dark",
    theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
  root.dataset.theme = theme;
};

const applyRootState = (root) => {
  applyTheme(root, getTheme());
  root.dataset.packageManager = getPackageManager();
};

const syncThemeButtons = () => {
  const theme = getTheme();
  document.querySelectorAll("[data-theme-value]").forEach((button) => {
    if (!(button instanceof HTMLElement)) return;
    button.setAttribute("aria-pressed", String(button.dataset.themeValue === theme));
  });
};

const normalizePath = (path) => (path === "/" ? "/" : path.replace(/\/+$/, ""));

const isActiveNavLink = (target, pathname) => {
  if (target === "/") return pathname === "/";
  if (
    target === "/docs" ||
    target === "/docs/components" ||
    target.startsWith("/docs/components/")
  ) {
    return pathname === target;
  }
  return pathname === target || pathname.startsWith(`${target}/`);
};

const syncSidebar = (scrollActive) => {
  const sidebar = document.querySelector(".docs-sidebar");
  if (!(sidebar instanceof HTMLElement)) return;

  const pathname = normalizePath(location.pathname);
  sidebar.querySelectorAll(".docs-nav-link").forEach((link) => {
    if (!(link instanceof HTMLAnchorElement)) return;
    const target = normalizePath(new URL(link.href, location.href).pathname);
    if (isActiveNavLink(target, pathname)) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  if (!scrollActive) return;

  const active = sidebar.querySelector('.docs-nav-link[aria-current="page"]');
  if (!(active instanceof HTMLElement)) return;

  const sidebarRect = sidebar.getBoundingClientRect();
  const linkRect = active.getBoundingClientRect();
  const padding = 16;
  if (
    linkRect.top >= sidebarRect.top + padding &&
    linkRect.bottom <= sidebarRect.bottom - padding
  ) {
    return;
  }

  sidebar.scrollTop +=
    linkRect.top - sidebarRect.top - (sidebar.clientHeight - linkRect.height) / 2;
};

const progress = document.querySelector("[data-route-progress]");
const progressDelay = 120;
let progressTimer = 0;
let progressBusy = false;

const setProgress = (active) => {
  progressBusy = active;
  progress?.classList.toggle("is-active", active);

  const content = document.querySelector("#content");
  if (!(content instanceof HTMLElement)) return;
  if (active) {
    content.setAttribute("aria-busy", "true");
  } else {
    content.removeAttribute("aria-busy");
  }
};

const startProgress = () => {
  window.clearTimeout(progressTimer);
  progressTimer = window.setTimeout(() => setProgress(true), progressDelay);
};

const stopProgress = () => {
  window.clearTimeout(progressTimer);
  progressTimer = 0;
  if (progressBusy) setProgress(false);
};

let navigationType = "load";
let sidebarScrollTop = 0;
let navigatedFromSidebar = false;

document.addEventListener("astro:before-preparation", (event) => {
  navigationType = event.navigationType;
  navigatedFromSidebar =
    event.sourceElement instanceof Element &&
    Boolean(event.sourceElement.closest(".docs-sidebar"));

  const sidebar = document.querySelector(".docs-sidebar");
  if (sidebar instanceof HTMLElement) sidebarScrollTop = sidebar.scrollTop;

  startProgress();
});

document.addEventListener("astro:before-swap", (event) => {
  applyRootState(event.newDocument.documentElement);
});

document.addEventListener("astro:after-swap", () => {
  applyRootState(document.documentElement);
  syncThemeButtons();

  const sidebar = document.querySelector(".docs-sidebar");
  if (sidebar instanceof HTMLElement) {
    // The persisted sidebar is re-inserted after the swap; force layout before
    // restoring its scroll position so the assignment is not clamped to zero.
    void sidebar.scrollHeight;
    sidebar.scrollTop = sidebarScrollTop;
  }

  const revealActive =
    navigationType !== "load" && navigationType !== "traverse" && !navigatedFromSidebar;
  syncSidebar(revealActive);
  stopProgress();
});

document.addEventListener("astro:page-load", () => {
  stopProgress();
  syncThemeButtons();
  syncSidebar(false);

  const shouldFocus =
    (navigationType === "push" || navigationType === "replace") && !location.hash;
  const activeElement = document.activeElement;
  const focusIsPersisted =
    activeElement instanceof Element &&
    activeElement.closest("[data-astro-transition-persist]");

  document.body.classList.remove("docs-focus-heading");

  if (shouldFocus && !focusIsPersisted) {
    const heading = document.querySelector(".docs-main h1");
    const target = heading instanceof HTMLElement ? heading : document.querySelector(".docs-main");
    if (target instanceof HTMLElement) {
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
      if (document.activeElement === target) {
        document.body.classList.add("docs-focus-heading");
      }
    }
  }

  navigationType = "load";
  navigatedFromSidebar = false;
});

syncThemeButtons();
syncSidebar(false);
