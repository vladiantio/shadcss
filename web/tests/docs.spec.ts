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
