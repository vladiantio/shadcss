export type TocHeading = {
  depth: 2 | 3;
  slug: string;
  text: string;
};

const headingPattern = /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi;

const voidElements = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);

function decodeEntities(value: string): string {
  return value.replace(
    /&(?:#([0-9]+)|#x([0-9a-f]+)|([a-z][a-z0-9]+));/gi,
    (match, decimal: string | undefined, hex: string | undefined, named: string | undefined) => {
      const codePoint = decimal
        ? Number.parseInt(decimal, 10)
        : hex
          ? Number.parseInt(hex, 16)
          : undefined;

      if (codePoint !== undefined) {
        return Number.isNaN(codePoint) || codePoint > 0x10ffff
          ? match
          : String.fromCodePoint(codePoint);
      }

      switch (named?.toLowerCase()) {
        case "amp":
          return "&";
        case "apos":
          return "'";
        case "gt":
          return ">";
        case "lt":
          return "<";
        case "nbsp":
          return " ";
        case "quot":
          return '"';
        default:
          return match;
      }
    }
  );
}

function headingText(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/[\s-]+/g, "-")
      .replace(/^-|-$/g, "") || "section"
  );
}

/**
 * Finds ranges occupied by subtrees marked with `data-toc-ignore`. Component
 * previews use it so demo headings never leak into the page table of contents.
 */
function findIgnoredRanges(html: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const tags = /<(\/?)([a-zA-Z][\w:-]*)([^>]*)>/g;
  const stack: string[] = [];
  let depth = 0;
  let start = 0;
  let match: RegExpExecArray | null;

  while ((match = tags.exec(html))) {
    const [tag, closing, rawName, attrs] = match;
    const name = rawName.toLowerCase();

    if (closing) {
      const index = stack.lastIndexOf(name);
      if (index === -1) continue;
      stack.length = index;

      if (depth > 0) {
        depth -= 1;
        if (depth === 0) ranges.push([start, match.index + tag.length]);
      }
      continue;
    }

    if (voidElements.has(name) || /\/\s*>$/.test(tag)) continue;
    stack.push(name);

    if (depth > 0) {
      depth += 1;
    } else if (/\bdata-toc-ignore\b/.test(attrs)) {
      depth = 1;
      start = match.index;
    }
  }

  if (depth > 0) ranges.push([start, html.length]);

  return ranges;
}

/**
 * Adds stable `id` attributes to every `h2`/`h3` and returns the headings that
 * feed the table of contents. Headings inside ignored previews are left alone.
 */
export function addHeadingAnchors(html: string): {
  html: string;
  headings: TocHeading[];
} {
  const ignored = findIgnoredRanges(html);
  const headings: TocHeading[] = [];
  const used = new Set<string>();
  let ignoredIndex = 0;

  const output = html.replace(
    headingPattern,
    (match: string, depth: string, attrs: string, inner: string, offset: number) => {
      while (ignoredIndex < ignored.length && ignored[ignoredIndex][1] <= offset) {
        ignoredIndex += 1;
      }

      const range = ignored[ignoredIndex];
      if (range && offset >= range[0] && offset < range[1]) return match;

      const text = headingText(inner);
      if (!text) return match;

      const idMatch = attrs.match(/\sid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i);
      const existing = idMatch?.[1] ?? idMatch?.[2] ?? idMatch?.[3];

      let slug = existing ?? slugify(text);

      if (!existing) {
        const base = slug;
        let suffix = 1;
        while (used.has(slug)) slug = `${base}-${suffix++}`;
      }

      used.add(slug);
      headings.push({ depth: Number(depth) as 2 | 3, slug, text });

      return existing ? match : `<h${depth}${attrs} id="${slug}">${inner}</h${depth}>`;
    }
  );

  return { html: output, headings };
}
