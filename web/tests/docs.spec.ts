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
