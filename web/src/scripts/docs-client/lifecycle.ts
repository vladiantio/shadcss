export interface NavigationInfo {
  type: "load" | "push" | "replace" | "traverse";
  sourceElement?: Element;
}

export interface PageBehavior {
  /** Runs after the current page is ready. Return a cleanup for the next swap. */
  mount(info: NavigationInfo): (() => void) | void;
  /** Runs when a client navigation starts. */
  navigationStart?(info: NavigationInfo): void;
  /** Runs after the new document is swapped in, before the page mounts. */
  afterSwap?(): void;
}

interface PageLifecycleOptions {
  behaviors: PageBehavior[];
  applyPreferences(root: HTMLElement): void;
}

let started = false;

/**
 * Owns the Astro client-router lifecycle. Behaviors mount once per page and
 * clean up before the next swap; preference root state is applied on both
 * sides of the swap so the incoming page never paints in the wrong theme.
 */
export function startPageLifecycle({
  behaviors,
  applyPreferences
}: PageLifecycleOptions): void {
  if (started) return;
  started = true;

  let mounted = false;
  let cleanups: Array<() => void> = [];
  let info: NavigationInfo = { type: "load" };

  const cleanupPage = () => {
    for (const cleanup of cleanups.splice(0).reverse()) {
      cleanup();
    }
    mounted = false;
  };

  const mount = (nextInfo: NavigationInfo) => {
    if (mounted) return;

    applyPreferences(document.documentElement);
    cleanups = behaviors
      .map((behavior) => behavior.mount(nextInfo))
      .filter((cleanup): cleanup is () => void => typeof cleanup === "function");
    mounted = true;
  };

  document.addEventListener("astro:before-preparation", (event) => {
    info = {
      type: event.navigationType,
      sourceElement: event.sourceElement
    };
    for (const behavior of behaviors) {
      behavior.navigationStart?.(info);
    }
  });

  document.addEventListener("astro:before-swap", (event) => {
    cleanupPage();
    applyPreferences(event.newDocument.documentElement);
  });

  document.addEventListener("astro:after-swap", () => {
    applyPreferences(document.documentElement);
    for (const behavior of behaviors) {
      behavior.afterSwap?.();
    }
  });

  document.addEventListener("astro:page-load", () => {
    mount(info);
    info = { type: "load" };
  });

  applyPreferences(document.documentElement);
  if (document.readyState === "complete") {
    mount(info);
  }
}
