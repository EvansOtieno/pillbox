import { expect, test, type Page } from "@playwright/test";
import { TEST_USERS } from "../../scripts/test-users";

// Admin flows against the local database. They change shared data (prices, settings), so they run one
// at a time on desktop only and put things back as they go.
test.describe.configure({ mode: "serial", timeout: 60_000 });
test.skip(({ isMobile }) => isMobile, "admin flows run on desktop only");

async function signIn(page: Page, who: keyof typeof TEST_USERS, next = "/admin") {
  await page.goto(next);
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel("Email").fill(TEST_USERS[who].email);
  await page.getByLabel("Password").fill(TEST_USERS[who].password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/\/admin\/login/);
}

async function placePickupOrder(page: Page) {
  await page.goto("/product/digital-thermometer-1-unit");
  await page.getByRole("region", { name: "Digital Thermometer 1 unit" }).getByRole("button", { name: "Add to cart" }).click();
  await page.getByRole("dialog", { name: "Your cart" }).getByRole("link", { name: "Go to checkout" }).click();
  await page.getByLabel("Full name").fill("Admin Flow Customer");
  await page.getByLabel("Phone (WhatsApp preferred)").fill("0722 000 111");
  await page.getByLabel("Pick-up").check();
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page).toHaveURL(/\/order\//, { timeout: 20_000 });
  return Number((await page.getByText(/Your order number is #\d+/).textContent())?.match(/#(\d+)/)?.[1]);
}

test("the admin needs a staff login, and a wrong password is refused", async ({ page }) => {
  await page.goto("/admin/products");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fproducts/);
  await page.getByLabel("Email").fill(TEST_USERS.staff.email);
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "don't match a staff account" })).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveValue(TEST_USERS.staff.email);
});

test("a new order shows up for staff, who confirm and complete it", async ({ page }) => {
  const number = await placePickupOrder(page);
  await signIn(page, "staff");

  await expect(page.getByRole("region", { name: "Today's orders" })).toContainText(`#${number}`);
  await page.getByRole("link", { name: `#${number}` }).first().click();
  await expect(page.getByRole("heading", { name: `Order #${number}` })).toBeVisible();
  await expect(page.getByRole("link", { name: "WhatsApp Admin" })).toHaveAttribute(
    "href",
    new RegExp(`wa\\.me/254722000111\\?text=.*order%20%23${number}`),
  );

  await page.getByRole("button", { name: "Mark as confirmed" }).click();
  await expect(page.locator('[aria-current="step"]')).toContainText("Confirmed");

  await page.getByRole("button", { name: "Mark as completed" }).click();
  await expect(page.locator('[aria-current="step"]')).toContainText("Completed");
  await expect(page.getByRole("button", { name: /Mark as/ })).toHaveCount(0);
});

test("a price changed in the admin shows in the shop straight away", async ({ page }) => {
  await signIn(page, "staff", "/admin/products?q=Pulse+Oximeter");
  const row = page.getByRole("form", { name: "Quick edit Pulse Oximeter 1 unit" });
  const price = row.getByLabel("Price (KES)");
  const original = await price.inputValue();

  await price.fill("2999");
  await row.getByRole("button", { name: "Save" }).click();
  await expect(row.getByRole("status")).toContainText("Saved");

  await page.goto("/product/pulse-oximeter-1-unit");
  await expect(page.getByRole("region", { name: "Pulse Oximeter 1 unit" })).toContainText("KES 2,999");

  // Put it back
  await page.goto("/admin/products?q=Pulse+Oximeter");
  await price.fill(original);
  await row.getByRole("button", { name: "Save" }).click();
  await expect(row.getByRole("status")).toContainText("Saved");
});

test("a bad price is refused with a message next to the field", async ({ page }) => {
  await signIn(page, "staff", "/admin/products?q=Pulse+Oximeter");
  const row = page.getByRole("form", { name: "Quick edit Pulse Oximeter 1 unit" });
  await row.getByLabel("Price (KES)").fill("12.50");
  await row.getByRole("button", { name: "Save" }).click();
  await expect(row.getByText("Whole shillings, e.g. 450")).toBeVisible();
});

test("staff can't open owner pages; the owner can change site text", async ({ page }) => {
  await signIn(page, "staff", "/admin/settings");
  await expect(page).toHaveURL(/\/admin\?error=owner-only/);
  await expect(page.getByRole("alert").filter({ hasText: "owner only" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Settings" })).toHaveCount(0);

  await page.context().clearCookies();
  await signIn(page, "owner", "/admin/settings?tab=home");
  const headline = page.getByLabel("Headline");
  const original = await headline.inputValue();
  await headline.fill("Medicines, delivered across Nairobi");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status").getByText("Saved")).toBeVisible();

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Medicines, delivered across Nairobi");

  await page.goto("/admin/settings?tab=home");
  await headline.fill(original);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status").getByText("Saved")).toBeVisible();
});

test("settings are validated before saving", async ({ page }) => {
  await signIn(page, "owner", "/admin/settings?tab=contact");
  await page.getByLabel("WhatsApp number").fill("12345");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toContainText("Nothing was saved");
  await expect(page.getByText("Enter a Kenyan mobile number")).toBeVisible();
});

test("a product photo uploads to Storage and appears in the shop", async ({ page }) => {
  await signIn(page, "staff", "/admin/products?q=Weekly+Pill+Organiser");
  await page.getByRole("link", { name: "Weekly Pill Organiser 1 unit" }).click();

  // A tiny valid PNG (1x1 pixel)
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  );
  await page.getByLabel(/Upload a photo|Replace photo/).setInputFiles({ name: "organiser.png", mimeType: "image/png", buffer: png });
  await expect(page.getByText("Photo saved")).toBeVisible({ timeout: 15_000 });

  await page.goto("/product/weekly-pill-organiser-1-unit");
  await expect(page.getByRole("img", { name: "Weekly Pill Organiser 1 unit" })).toBeVisible();

  // Put it back
  await page.goto("/admin/products?q=Weekly+Pill+Organiser");
  await page.getByRole("link", { name: "Weekly Pill Organiser 1 unit" }).click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Remove photo" }).click();
  await expect(page.getByText("Photo removed")).toBeVisible();
});
