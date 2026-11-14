import type { NavigationInfo, PageBehavior } from "./lifecycle";

const normalizePath = (path: string): string =>
  path === "/" ? "/" : path.replace(/\/+$/, "");

const isActiveNavLink = (target: string, pathname: string): boolean => {
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

const syncSidebar = (scrollActive: boolean): void => {
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

const progressDelay = 120;
let progressTimer = 0;
let progressBusy = false;
let currentInfo: NavigationInfo = { type: "load" };
let sidebarScrollTop = 0;

const setProgress = (active: boolean): void => {
  progressBusy = active;
  document.querySelector("[data-route-progress]")?.classList.toggle("is-active", active);

  const content = document.querySelector("#content");
  if (!(content instanceof HTMLElement)) return;
  if (active) {
    content.setAttribute("aria-busy", "true");
  } else {
    content.removeAttribute("aria-busy");
  }
};

const startProgress = (): void => {
  window.clearTimeout(progressTimer);
  progressTimer = window.setTimeout(() => setProgress(true), progressDelay);
};

const stopProgress = (): void => {
  window.clearTimeout(progressTimer);
  progressTimer = 0;
  if (progressBusy) setProgress(false);
};

const navigatedFromSidebar = (info: NavigationInfo): boolean =>
  info.sourceElement instanceof Element &&
  Boolean(info.sourceElement.closest(".docs-sidebar"));

const focusHeading = (info: NavigationInfo): void => {
  const shouldFocus =
    (info.type === "push" || info.type === "replace") && !location.hash;
  const activeElement = document.activeElement;
  const focusIsPersisted =
    activeElement instanceof Element &&
    activeElement.closest("[data-astro-transition-persist]");

  document.body.classList.remove("docs-focus-heading");

  if (!shouldFocus || focusIsPersisted) return;

  const heading = document.querySelector(".docs-main h1");
  const target =
    heading instanceof HTMLElement ? heading : document.querySelector(".docs-main");
  if (!(target instanceof HTMLElement)) return;

  target.tabIndex = -1;
  target.focus({ preventScroll: true });
  if (document.activeElement === target) {
    document.body.classList.add("docs-focus-heading");
  }
};

export const navigation: PageBehavior = {
  navigationStart(info) {
    currentInfo = info;

    const sidebar = document.querySelector(".docs-sidebar");
    if (sidebar instanceof HTMLElement) sidebarScrollTop = sidebar.scrollTop;

    startProgress();
  },

  afterSwap() {
    const sidebar = document.querySelector(".docs-sidebar");
    if (sidebar instanceof HTMLElement) {
      // The persisted sidebar is re-inserted after the swap; force layout before
      // restoring its scroll position so the assignment is not clamped to zero.
      void sidebar.scrollHeight;
      sidebar.scrollTop = sidebarScrollTop;
    }

    const revealActive =
      currentInfo.type !== "load" &&
      currentInfo.type !== "traverse" &&
      !navigatedFromSidebar(currentInfo);
    syncSidebar(revealActive);
    stopProgress();
  },

  mount(info) {
    stopProgress();
    syncSidebar(false);
    focusHeading(info);

    currentInfo = { type: "load" };
  }
};
