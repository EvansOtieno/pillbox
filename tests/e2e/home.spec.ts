import { expect, test } from "@playwright/test";

test("home page shows the hero, categories and featured products from the database", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Afya Corner/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your neighbourhood pharmacy, online");
  await expect(page.getByRole("link", { name: /Pain & fever/ })).toBeVisible();
  await expect(page.locator("#categories-title + ul > li")).toHaveCount(6);
  await expect(page.getByRole("heading", { name: "Popular right now" })).toBeVisible();
});

test("dock links to WhatsApp with a pre-filled message, and to a phone call", async ({ page }) => {
  await page.goto("/");
  const dock = page.getByRole("complementary", { name: "Contact a pharmacist" });
  await expect(dock.getByRole("link", { name: "WhatsApp" })).toHaveAttribute(
    "href",
    /^https:\/\/wa\.me\/254\d{9}\?text=Hello%20Afya%20Corner/,
  );
  await expect(dock.getByRole("link", { name: "Call" })).toHaveAttribute("href", /^tel:\+254\d{9}$/);
});
