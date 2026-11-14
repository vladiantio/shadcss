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
