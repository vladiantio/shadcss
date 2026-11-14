import type { PageBehavior } from "./lifecycle";

type TocLink = {
  toc: HTMLElement;
  link: HTMLAnchorElement;
  heading: HTMLElement;
  slug: string;
};

export const toc: PageBehavior = {
  mount() {
    const tocs = Array.from(document.querySelectorAll<HTMLElement>("[data-toc]"));
    const links: TocLink[] = [];

    for (const tocElement of tocs) {
      for (const link of tocElement.querySelectorAll<HTMLAnchorElement>("[data-toc-link]")) {
        const slug = decodeURIComponent(link.hash.slice(1));
        const heading = document.getElementById(slug);
        if (heading) links.push({ toc: tocElement, link, heading, slug });
      }
    }

    const headings = Array.from(
      new Map(links.map((entry) => [entry.slug, entry.heading])).values()
    );

    if (headings.length === 0) return;

    const visible = (heading: HTMLElement): boolean => {
      const rect = heading.getBoundingClientRect();
      if (rect.height === 0) return false;
      const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      return visibleHeight >= rect.height * 0.9;
    };

    const activeHeadings = (): HTMLElement[] => {
      const inView = headings.filter(visible);
      if (inView.length > 0) return inView;

      // When no heading is fully in view, use the last one above the viewport center.
      const center = window.innerHeight / 2;
      let fallback: HTMLElement | undefined;
      for (const heading of headings) {
        const rect = heading.getBoundingClientRect();
        if (rect.height === 0) continue;
        if (rect.top >= center) break;
        fallback = heading;
      }

      return fallback ? [fallback] : headings.length > 0 ? [headings[0]] : [];
    };

    let primary: string | undefined;
    let lastPrimary: string | undefined;

    const update = () => {
      if (headings.length === 0) return;

      const active = activeHeadings();
      const activeSlugs = new Set(active.map((heading) => heading.id));
      primary = active[0]?.id;

      for (const entry of links) {
        const isActive = activeSlugs.has(entry.slug);
        entry.link.setAttribute("data-active", String(isActive));

        if (entry.slug === primary) {
          entry.link.setAttribute("aria-current", "location");
        } else {
          entry.link.removeAttribute("aria-current");
        }
      }

      for (const tocElement of tocs) {
        const highlight = tocElement.querySelector<HTMLElement>("[data-toc-highlight]");
        const list = tocElement.querySelector<HTMLElement>("[data-toc-list]");
        if (!highlight || !list) continue;

        const tocLinks = links.filter(
          (entry) => entry.toc === tocElement && activeSlugs.has(entry.slug)
        );
        const first = tocLinks[0];
        const last = tocLinks[tocLinks.length - 1];

        if (!first || !last) {
          highlight.style.clipPath = "inset(0 0 100% round 8px)";
          continue;
        }

        const top = first.link.offsetTop;
        const bottom = last.link.offsetTop + last.link.offsetHeight;
        highlight.style.clipPath = `inset(${top}px 0 ${list.offsetHeight - bottom}px round 8px)`;

        if (!highlight.hasAttribute("data-ready")) {
          // Enable transitions only after the initial position is painted.
          requestAnimationFrame(() => highlight.setAttribute("data-ready", ""));
        }

        if (primary !== lastPrimary) {
          lastPrimary = primary;
          const scroller = tocElement.querySelector<HTMLElement>("[data-toc-scroll]");
          if (!scroller) continue;

          const linkRect = first.link.getBoundingClientRect();
          const scrollerRect = scroller.getBoundingClientRect();
          if (linkRect.top < scrollerRect.top + 16 || linkRect.bottom > scrollerRect.bottom - 16) {
            const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "auto"
              : "smooth";

            scroller.scrollTo({
              top:
                scroller.scrollTop +
                linkRect.top -
                scrollerRect.top -
                scroller.clientHeight / 2 +
                linkRect.height / 2,
              behavior
            });
          }
        }
      }
    };

    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    const onScroll = () => schedule();
    const onResize = () => schedule();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };
  }
};
