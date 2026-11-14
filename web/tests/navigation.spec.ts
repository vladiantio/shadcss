import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

function blocking(violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]) {
  return violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical"
  );
}

test("client navigation keeps the shell mounted", async ({ page }) => {
  await page.goto("/docs");
  await page.evaluate("window.__docsNavigationMarker = 'kept'");

  const header = page.locator(".docs-header");
  const sidebarElement = page.locator(".docs-sidebar");
  await header.evaluate((element) => element.setAttribute("data-test-persist", "header"));
  await sidebarElement.evaluate((element) => {
    element.setAttribute("data-test-persist", "sidebar");
    element.scrollTop = 40;
  });

  const sidebar = page.getByRole("navigation", { name: "Documentation" });
  await sidebar.getByRole("link", { name: "Installation" }).click();

  await expect(page).toHaveURL(/\/docs\/installation$/);
  await expect(page).toHaveTitle(/Installation — loseta/);
  await expect(page.getByRole("heading", { level: 1, name: "Installation" })).toBeVisible();
  expect(await page.evaluate("window.__docsNavigationMarker")).toBe("kept");
  await expect(header).toHaveAttribute("data-test-persist", "header");
  await expect(sidebarElement).toHaveAttribute("data-test-persist", "sidebar");
  expect(await sidebarElement.evaluate((element) => element.scrollTop)).toBe(40);
  await expect(sidebar.getByRole("link", { name: "Installation" })).toHaveAttribute(
    "aria-current",
    "page"
  );
});

test("client navigation preserves theme and package manager", async ({ page }) => {
  await page.goto("/docs/installation");
  await page.getByRole("button", { name: "Dark theme" }).click();

  const firstCommand = page.locator(".install-command").first();
  await firstCommand.locator("[data-package-manager-value='npm']").click();

  const sidebar = page.getByRole("navigation", { name: "Documentation" });
  await sidebar.getByRole("link", { name: "Theming" }).click();

  await expect(page).toHaveURL(/\/docs\/theming$/);
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await expect(page.getByRole("button", { name: "Dark theme" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  await sidebar.getByRole("link", { name: "Installation" }).click();
  const command = page.locator(".install-command").first();
  await expect(command.locator("[data-package-manager-value='npm']")).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(command.locator("[data-package-manager-panel='npm']")).toBeVisible();
});

test("repeated client navigation keeps preferences and remounts the page", async ({ page }) => {
  await page.goto("/docs/installation");
  await page.getByRole("button", { name: "Dark theme" }).click();

  const command = page.locator(".install-command").first();
  await command.locator("[data-package-manager-value='npm']").click();

  const sidebar = page.getByRole("navigation", { name: "Documentation" });
  await sidebar.getByRole("link", { name: "Theming" }).click();
  await expect(page).toHaveURL(/\/docs\/theming$/);

  const toc = page.getByRole("navigation", { name: "Table of contents" });
  await expect(toc.getByRole("link", { name: "Layers" })).toBeVisible();

  const buttonLink = sidebar.getByRole("link", { name: "Button", exact: true });
  await buttonLink.click();
  await expect(page).toHaveURL(/\/docs\/components\/button$/);

  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await expect(page.getByRole("button", { name: "Dark theme" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  const buttonCommand = page.locator(".install-command").first();
  await expect(buttonCommand.locator("[data-package-manager-value='npm']")).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(buttonCommand.locator("[data-package-manager-panel='npm']")).toBeVisible();

  await expect(toc.getByRole("link", { name: "Layers" })).toHaveCount(0);
  await expect(toc.getByRole("link", { name: "Install contract" })).toBeVisible();

  const current = sidebar.locator('[aria-current="page"]');
  await expect(current).toHaveCount(1);
  await expect(current).toHaveText("Button");
  await expect(buttonLink).toBeFocused();
});

test("in-content navigation focuses the new heading", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Browse components" }).click();

  await expect(page).toHaveURL(/\/docs\/components$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
});

test("sidebar navigation keeps focus on the active link", async ({ page }) => {
  await page.goto("/docs");
  const sidebar = page.getByRole("navigation", { name: "Documentation" });
  const link = sidebar.getByRole("link", { name: "Theming" });

  await link.focus();
  await link.press("Enter");

  await expect(page).toHaveURL(/\/docs\/theming$/);
  await expect(link).toBeFocused();
});

test("slow client navigation shows the progress indicator", async ({ page }) => {
  await page.goto("/docs");
  await page.route("**/docs/theming", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 450));
    await route.continue();
  });

  const sidebar = page.getByRole("navigation", { name: "Documentation" });
  const link = sidebar.getByRole("link", { name: "Theming" });
  await link.focus();
  await link.press("Enter");

  const progress = page.locator("[data-route-progress]");
  await expect(progress).toHaveClass(/is-active/);
  await expect(page.locator("#content")).toHaveAttribute("aria-busy", "true");
  await expect(page).toHaveURL(/\/docs\/theming$/);
  await expect(progress).not.toHaveClass(/is-active/);
  await expect(page.locator("#content")).not.toHaveAttribute("aria-busy", "true");
});

test("table of contents updates after client navigation", async ({ page }) => {
  await page.goto("/docs/theming");
  await page
    .getByRole("navigation", { name: "Documentation" })
    .getByRole("link", { name: "Installation" })
    .click();

  const toc = page.getByRole("navigation", { name: "Table of contents" });
  await expect(toc.getByRole("link", { name: "Coexistence" })).toBeVisible();
  await expect(toc.getByRole("link", { name: "Layers" })).toHaveCount(0);

  await toc.getByRole("link", { name: "Coexistence" }).click();
  await expect(page).toHaveURL(/#coexistence$/);
  await expect(toc.getByRole("link", { name: "Coexistence" })).toHaveAttribute(
    "data-active",
    "true"
  );
});

test("pages remain fully rendered HTML for crawlers", async ({ request }) => {
  const response = await request.get("/docs/components/button");
  expect(response.ok()).toBe(true);
  const html = await response.text();

  expect(html).toContain("<title>Button — loseta</title>");
  expect(html).toContain('name="description"');
  expect(html).toMatch(/<h1[^>]*>Button<\/h1>/);
  expect(html).toContain('data-astro-transition-persist="docs-header"');
  expect(html).toContain('data-astro-transition-persist="docs-sidebar"');
});

test("skip link moves focus to the main content", async ({ page }) => {
  await page.goto("/docs");
  await page.keyboard.press("Tab");

  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();

  await skip.press("Enter");
  await expect(page.locator("#content")).toBeFocused();
});

test("axe: client navigation", async ({ page }) => {
  await page.goto("/docs");
  await page
    .getByRole("navigation", { name: "Documentation" })
    .getByRole("link", { name: "Theming" })
    .click();
  await expect(page).toHaveURL(/\/docs\/theming$/);
  await page.waitForLoadState("networkidle");
  await page.addStyleTag({
    content: "*, *::before, *::after { transition: none !important; animation: none !important; }"
  });

  const results = await new AxeBuilder({ page }).withTags(tags).analyze();
  const violations = blocking(results.violations);
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
});
