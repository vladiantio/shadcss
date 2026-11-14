import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { components } from "../src/data/components";

const staticPages = ["/", "/docs", "/docs/installation", "/docs/theming", "/docs/components"];
const pages = [
  ...staticPages,
  ...components.map((component) => `/docs/components/${component.id}`)
];

const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

function blocking(violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]) {
  return violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical"
  );
}

test("home renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Native CSS scaffolds");
});

test("theme switch supports system, light and dark", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  const system = page.getByRole("button", { name: "System theme" });
  const light = page.getByRole("button", { name: "Light theme" });
  const dark = page.getByRole("button", { name: "Dark theme" });

  await expect(system).toHaveAttribute("aria-pressed", "true");

  await light.click();
  await expect(light).toHaveAttribute("aria-pressed", "true");
  await expect(html).not.toHaveClass(/\bdark\b/);
  expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("light");

  await dark.click();
  await expect(dark).toHaveAttribute("aria-pressed", "true");
  await expect(html).toHaveClass(/\bdark\b/);

  await page.reload();
  await expect(dark).toHaveAttribute("aria-pressed", "true");
  await expect(html).toHaveClass(/\bdark\b/);

  await system.click();
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(html).toHaveClass(/\bdark\b/);
  await page.emulateMedia({ colorScheme: "light" });
  await expect(html).not.toHaveClass(/\bdark\b/);
});

test("install command switches between pnpm and npm", async ({ page }) => {
  await page.goto("/docs/installation");
  const commands = page.locator(".install-command");
  const command = commands.first();
  const pnpm = command.locator("[data-package-manager-value='pnpm']");
  const npm = command.locator("[data-package-manager-value='npm']");
  const pnpmPanel = command.locator("[data-package-manager-panel='pnpm']");
  const npmPanel = command.locator("[data-package-manager-panel='npm']");

  await expect(pnpm).toHaveAttribute("aria-pressed", "true");
  await expect(npm).toHaveAttribute("aria-pressed", "false");
  await expect(pnpmPanel).toBeVisible();
  await expect(pnpmPanel.locator("code")).toContainText("pnpm dlx loseta init");
  await expect(npmPanel).toBeHidden();

  await npm.click();
  await expect(npm).toHaveAttribute("aria-pressed", "true");
  await expect(pnpm).toHaveAttribute("aria-pressed", "false");
  await expect(pnpmPanel).toBeHidden();
  await expect(npmPanel.locator("code")).toContainText("npx loseta init");

  const count = await commands.count();
  expect(count).toBeGreaterThan(1);
  for (let index = 0; index < count; index += 1) {
    const item = commands.nth(index);
    await expect(item.locator("[data-package-manager-value='pnpm']")).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    await expect(item.locator("[data-package-manager-value='npm']")).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(item.locator("[data-package-manager-panel='pnpm']")).toBeHidden();
    await expect(item.locator("[data-package-manager-panel='npm']")).toBeVisible();
  }
});

test("install command remembers the package manager", async ({ page }) => {
  await page.goto("/docs/installation");
  const first = page.locator(".install-command").first();
  await first.locator("[data-package-manager-value='npm']").click();

  await page.reload();
  await expect(first.locator("[data-package-manager-value='pnpm']")).toHaveAttribute(
    "aria-pressed",
    "false"
  );
  await expect(first.locator("[data-package-manager-value='npm']")).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(first.locator("[data-package-manager-panel='npm']")).toBeVisible();

  await page.goto("/docs/components");
  const command = page.locator(".install-command").first();
  await expect(command.locator("[data-package-manager-value='npm']")).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(command.locator("[data-package-manager-panel='npm']")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("package-manager"))).toBe("npm");
});

test("code block wrap toggle updates the pre", async ({ page }) => {
  await page.goto("/docs/components/code-block");
  const block = page.locator('[data-demo="code-block"]:has([data-demo-wrap])');
  const toggle = block.locator("[data-demo-wrap]");
  const pre = block.locator("pre");

  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(pre).toHaveAttribute("data-wrap", "");

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(pre).not.toHaveAttribute("data-wrap", "");

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(pre).toHaveAttribute("data-wrap", "");
});

test("component preview reveals cleaned example code", async ({ page }) => {
  await page.goto("/docs/components/dialog");
  const preview = page.locator("[data-component-preview]").first();
  const toggle = preview.getByRole("button", { name: "View code" });
  const source = preview.locator("[data-preview-source]");
  const pre = source.locator("pre");

  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(source).toHaveAttribute("aria-hidden", "true");
  await expect(pre).toHaveAttribute("tabindex", "-1");
  await expect(pre).toHaveCSS("overflow-x", "hidden");
  await expect(source.locator("code")).not.toContainText("data-open-dialog");

  await toggle.click();

  await expect(toggle).toBeHidden();
  await expect(source).not.toHaveAttribute("aria-hidden", "true");
  await expect(pre).toHaveAttribute("tabindex", "0");
  await expect(pre).toHaveCSS("overflow-x", "auto");
  await expect(pre).toBeFocused();
});

test("component preview copies the cleaned example markup", async ({ page }) => {
  await page.goto("/docs/components/dialog");
  const preview = page.locator("[data-component-preview]").first();

  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as unknown as { copiedCode?: string }).copiedCode = text;
        }
      }
    });
  });

  await preview.getByRole("button", { name: "View code" }).click();
  await preview.locator("[data-preview-source] [data-copy-icon]").click();

  const copied = await page.evaluate(
    () => (window as unknown as { copiedCode?: string }).copiedCode
  );
  expect(copied).toContain('<button type="button" class="btn">Open dialog</button>');
  expect(copied).not.toContain("data-open-dialog");
  await expect(page.getByRole("status")).toHaveText("Copied");
});

test("component preview remounts collapsed after client navigation", async ({
  page
}) => {
  await page.goto("/docs/components/button");
  const first = page.locator("[data-component-preview]").first();
  await first.getByRole("button", { name: "View code" }).click();
  await expect(first.locator("[data-preview-toggle]")).toBeHidden();

  await page
    .getByRole("navigation", { name: "Documentation" })
    .getByRole("link", { name: "Card", exact: true })
    .click();

  const next = page.locator("[data-component-preview]").first();
  await expect(next.getByRole("button", { name: "View code" })).toBeVisible();
  await expect(next.locator("[data-preview-source]")).toHaveAttribute(
    "aria-hidden",
    "true"
  );
});

test("short component examples keep their code visible", async ({ page }) => {
  for (const path of [
    "/docs/components/label",
    "/docs/components/button-group"
  ]) {
    await page.goto(path);
    const preview = page.locator("[data-component-preview]").first();

    await expect(preview, path).toHaveAttribute("data-code-open", "true");
    await expect(
      preview.getByRole("button", { name: "View code" }),
      path
    ).toHaveCount(0);
    await expect(preview.locator("[data-preview-source] pre"), path).toBeVisible();
    await expect(
      preview.locator("[data-preview-source] [data-copy-icon]"),
      path
    ).toBeVisible();
  }

  await page.goto("/docs/components/alert");
  const longPreview = page.locator("[data-component-preview]").first();
  await expect(
    longPreview.getByRole("button", { name: "View code" })
  ).toBeVisible();
});

test("component preview copy button appears on hover", async ({ page }) => {
  await page.goto("/docs/components/label");
  const preview = page.locator("[data-component-preview]").first();
  const actions = preview.locator("[data-preview-source] [data-slot='actions']");
  const pre = preview.locator("[data-preview-source] pre");

  await expect(actions).toHaveCSS("opacity", "0");
  await pre.hover();
  await expect(actions).toHaveCSS("opacity", "1");
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("component preview keeps code readable", async ({ page }) => {
    await page.goto("/docs/components/button");
    const preview = page.locator("[data-component-preview]").first();

    await expect(preview.locator("[data-preview-toggle]")).toBeHidden();
    await expect(preview.locator("[data-preview-source] pre")).toBeVisible();
    await expect(preview.locator("[data-preview-source] code")).toContainText(
      "Default"
    );
  });
});

test("every page has a table of contents with valid anchors", async ({ page }) => {
  for (const path of pages) {
    await page.goto(path);
    const toc = page.getByRole("navigation", { name: "Table of contents" });
    await expect(toc, path).toBeVisible();
    await expect(toc.locator("a").first(), path).toBeVisible();

    const broken = await toc.locator("a").evaluateAll((links) =>
      (links as HTMLAnchorElement[])
        .map((link) => link.hash)
        .filter((hash) => !document.getElementById(decodeURIComponent(hash.slice(1))))
    );
    expect(broken, path).toEqual([]);
  }
});

test("table of contents tracks the active heading", async ({ page }) => {
  await page.goto("/docs/theming");
  const toc = page.getByRole("navigation", { name: "Table of contents" });
  const layers = toc.getByRole("link", { name: "Layers" });
  const darkMode = toc.getByRole("link", { name: "Dark mode" });

  await expect(layers).toHaveAttribute("aria-current", "location");
  await expect(page.locator("#layers")).toHaveText("Layers");

  await darkMode.click();
  await expect(darkMode).toHaveAttribute("aria-current", "location");
  await expect(page).toHaveURL(/#dark-mode$/);
});

test("table of contents skips demo preview headings", async ({ page }) => {
  await page.goto("/docs/components/alert");
  const toc = page.getByRole("navigation", { name: "Table of contents" });

  await expect(toc.getByRole("link", { name: "Default" })).toBeVisible();
  await expect(toc.getByRole("link", { name: "Heads up!" })).toHaveCount(0);
  await expect(page.locator(".docs-preview h3").filter({ hasText: "Heads up!" })).toHaveCount(1);
});

for (const path of pages) {
  test(`axe: ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await page.addStyleTag({
      content: "*, *::before, *::after { transition: none !important; animation: none !important; }"
    });

    const light = await new AxeBuilder({ page }).withTags(tags).analyze();
    const lightBlocking = blocking(light.violations);
    expect(lightBlocking, JSON.stringify(lightBlocking, null, 2)).toEqual([]);

    await page.evaluate(() => document.documentElement.classList.add("dark"));
    const dark = await new AxeBuilder({ page }).withTags(tags).analyze();
    const darkBlocking = blocking(dark.violations);
    expect(darkBlocking, JSON.stringify(darkBlocking, null, 2)).toEqual([]);
  });
}
