import { expect, test } from "@playwright/test";

test.describe("open now (decided in the browser, Nairobi time)", () => {
  test("lit cross and closing time during opening hours", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-09-23T12:00:00+03:00")); // Wednesday noon
    await page.goto("/contact");
    await expect(page.getByRole("main").getByText("Open until 9:00 PM")).toBeVisible();
    await expect(page.locator("header a svg").first()).toHaveClass(/cross-lit/);
  });

  test("closed at night: unlit cross and the after-hours note", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-09-23T23:30:00+03:00"));
    await page.goto("/contact");
    await expect(page.getByRole("main").getByText("Closed. Opens tomorrow at 8:00 AM")).toBeVisible();
    await expect(page.locator("header a svg").first()).not.toHaveClass(/cross-lit/);
    await expect(page.getByText(/Our pharmacists reply from/)).toBeVisible();
  });
});

test("search finds products by prefix and explains when nothing matches", async ({ page }) => {
  await page.goto("/search?q=parac");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Results for “parac”");
  await expect(page.getByRole("link", { name: /Paracetamol 500mg Tablets 24s/ })).toBeVisible();

  await page.goto("/search?q=zzzqqq");
  await expect(page.getByText("No products match “zzzqqq”.")).toBeVisible();
});

test("shop filters are shareable URLs", async ({ page }) => {
  await page.goto("/shop?category=baby-mother&stock=1&sort=price-asc");
  await expect(page.getByRole("combobox").first()).toHaveValue("baby-mother");
  const prices = await page.locator("article").evaluateAll((cards) =>
    cards.map((c) => Number(c.textContent?.match(/KES ([\d,]+)/)?.[1].replace(/,/g, ""))),
  );
  expect(prices.length).toBeGreaterThan(0);
  expect(prices).toEqual([...prices].sort((a, b) => a - b));
  await expect(page.getByText("Out of stock")).toHaveCount(0);
});

test("prescription medicine: no price, no cart, consult on WhatsApp", async ({ page }) => {
  await page.goto("/product/amoxicillin-500mg-capsules-15s");
  const details = page.getByRole("region", { name: "Amoxicillin 500mg Capsules 15s" });
  await expect(details.getByText("This medicine needs a prescription.")).toBeVisible();
  await expect(details.getByText("Price on consultation")).toBeVisible();
  await expect(details.getByRole("button", { name: "Add to cart" })).toHaveCount(0);
  await expect(details.getByRole("link", { name: "Consult pharmacist" })).toHaveAttribute(
    "href",
    /wa\.me\/.*Amoxicillin%20500mg%20Capsules%2015s/,
  );
});

test("pharmacy-only medicine shows the confirmation notice", async ({ page }) => {
  await page.goto("/product/hydrocortisone-1-cream-15g");
  await expect(page.getByText("Pharmacy-only medicine: our pharmacist will contact you")).toBeVisible();
  await expect(page.getByText(/KES \d/).first()).toBeVisible();
});

test("FAQ answers embed the live delivery fee table", async ({ page }) => {
  await page.goto("/faq");
  await page.getByText("How much is delivery?").click();
  await expect(page.getByRole("table")).toContainText("Kilimani");
  await expect(page.getByRole("table")).toContainText("Free");
});

// With Cache Components the page shell streams first (HTTP 200), so a missing product is a "soft 404":
// the not-found UI plus <meta name="robots" content="noindex">. A real 404 status would need a database
// check in proxy.ts on every product request, slowing down the prerendered pages.
test("unknown products show a helpful not-found page that search engines skip", async ({ page }) => {
  await page.goto("/product/does-not-exist");
  await expect(page.getByRole("heading", { name: "We can't find that page" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Contact a pharmacist" })).toBeVisible();
  await expect(page.locator("head meta[name=robots]")).toHaveAttribute("content", /noindex/);
});

test("unknown URLs return a real 404 inside the site frame", async ({ page }) => {
  const response = await page.goto("/no-such-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "We can't find that page" })).toBeVisible();
});
