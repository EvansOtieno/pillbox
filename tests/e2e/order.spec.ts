import { expect, test, type Page } from "@playwright/test";

// The order flow from the plan: browse → add to cart → checkout → confirmation with the WhatsApp hand-off.
// Places real orders in the local database (pnpm db:reset clears them).

const VITAMIN_C = {
  path: "/product/vitamin-c-1000mg-effervescent-tablets-20s",
  name: "Vitamin C 1000mg Effervescent Tablets 20s",
};
const HYDROCORTISONE = { path: "/product/hydrocortisone-1-cream-15g", name: "Hydrocortisone 1% Cream 15g" }; // pharmacy-only

async function addToCart(page: Page, product: { path: string; name: string }) {
  await page.goto(product.path);
  // The product's own details region (related products further down have buttons too)
  await page.getByRole("region", { name: product.name }).getByRole("button", { name: "Add to cart" }).click();
  const drawer = page.getByRole("dialog", { name: "Your cart" });
  await expect(drawer).toBeVisible();
  return drawer;
}

async function fillDetails(page: Page) {
  await page.getByLabel("Full name").fill("Test Customer");
  await page.getByLabel("Phone (WhatsApp preferred)").fill("0712 345 678");
}

test("browse, add to cart, check out for pick-up, then hand the order to WhatsApp", async ({ page }) => {
  // Adding opens the drawer and updates the count
  let drawer = await addToCart(page, VITAMIN_C);
  await expect(drawer.getByText("Vitamin C 1000mg Effervescent Tablets 20s")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(page.getByRole("button", { name: "Cart, 1 item" })).toBeVisible();

  drawer = await addToCart(page, HYDROCORTISONE);
  await expect(drawer.getByText(/pharmacy-only medicines/)).toBeVisible();
  await drawer.getByRole("button", { name: /One more Hydrocortisone/ }).click();
  await expect(drawer.getByRole("group", { name: /Quantity of Hydrocortisone/ })).toContainText("2");
  await drawer.getByRole("link", { name: "Go to checkout" }).click();
  await expect(page).toHaveURL(/\/checkout$/);

  // Submitting empty shows every problem at once, with the summary focused
  await page.getByRole("button", { name: "Place order" }).click();
  const summary = page.getByRole("alert", { name: "Your order was not placed" });
  await expect(summary).toContainText("Your order was not placed");
  await expect(summary).toBeFocused();
  await expect(summary.getByRole("link", { name: /delivery address/ })).toBeVisible();
  await expect(page.getByLabel("Full name")).toHaveAttribute("aria-invalid", "true");

  // Delivery needs an address; pick-up doesn't
  await fillDetails(page);
  await page.getByLabel("Pick-up").check();
  await expect(page.getByLabel("Delivery address")).toHaveCount(0);
  await expect(page.getByRole("complementary", { name: "Order summary" })).toContainText("Free");
  await page.getByRole("button", { name: "Place order" }).click();

  // Confirmation page with the WhatsApp message (line breaks kept) and the call button
  await expect(page).toHaveURL(/\/order\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: "One more step: confirm with our pharmacist" })).toBeVisible();
  const whatsapp = page.getByRole("link", { name: "Send order on WhatsApp" });
  const href = (await whatsapp.getAttribute("href")) ?? "";
  expect(href).toMatch(/^https:\/\/wa\.me\/254\d{9}\?text=/);
  expect(href).toContain("%0A");
  expect(decodeURIComponent(href)).toContain("• (P) 2 × Hydrocortisone 1% Cream 15g");
  expect(decodeURIComponent(href)).toContain("Total to pay at pick-up");
  await expect(page.getByRole("link", { name: /^Call / })).toHaveAttribute("href", /^tel:\+254/);
  await expect(page.getByText(/Your order number is #\d+/)).toBeVisible();

  // The cart is emptied once the order is saved
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("afya-cart") ?? "{}"));
  expect(saved.state.items).toEqual([]);
});

test("delivery order: area fee is added and the address is saved", async ({ page }) => {
  await addToCart(page, VITAMIN_C);
  await page.goto("/checkout");
  await fillDetails(page);
  await page.getByLabel("Delivery area").selectOption({ label: "Kilimani: KES 150" });
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page.getByLabel("Delivery address")).toHaveAttribute("aria-invalid", "true");

  await page.getByLabel("Delivery address").fill("Kindaruma Road, Apt 4B");
  await expect(page.getByRole("complementary", { name: "Order summary" })).toContainText("KES 1,000");
  await page.getByRole("button", { name: "Place order" }).click();

  await expect(page).toHaveURL(/\/order\//);
  await expect(page.getByText("Deliver to", { exact: true })).toBeVisible();
  await expect(page.getByText("Kindaruma Road, Apt 4B").first()).toBeVisible();
  await expect(page.getByText("Total to pay on delivery: KES 1,000")).toBeVisible();
});

test("a stale price in the cart is caught by the database and corrected for review", async ({ page }) => {
  await page.goto("/");
  // Simulate a cart saved before a price change (or tampered with): real price is KES 850.
  await page.evaluate(() =>
    localStorage.setItem(
      "afya-cart",
      JSON.stringify({
        version: 1,
        state: {
          items: [
            {
              productId: 55,
              slug: "vitamin-c-1000mg-effervescent-tablets-20s",
              name: "Vitamin C 1000mg Effervescent Tablets 20s",
              priceKes: 1,
              rxClass: "general",
              categorySlug: "vitamins-supplements",
              qty: 1,
            },
          ],
        },
      }),
    ),
  );
  await page.goto("/checkout");
  await fillDetails(page);
  await page.getByLabel("Pick-up").check();
  await page.getByRole("button", { name: "Place order" }).click();

  await expect(page.getByRole("alert", { name: "Your order was not placed" })).toContainText(
    "The price of Vitamin C 1000mg Effervescent Tablets 20s is now KES 850.",
  );
  await expect(page.getByRole("complementary", { name: "Order summary" })).toContainText("KES 850");

  // Placing it again with the corrected price works
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page).toHaveURL(/\/order\//);
});
