import { expect, test } from "@playwright/test";

test("home page renders the brand", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Afya Corner/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Afya Corner");
});
