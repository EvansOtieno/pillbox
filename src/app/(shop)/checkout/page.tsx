import type { Metadata } from "next";
import { PageHeading } from "@/components/sections";
import { getDeliveryAreas, getSettings } from "@/lib/data/storefront";
import { sortDeliveryOptions } from "@/lib/domain/delivery";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

// The page itself is static (areas and settings are cached); the cart is read in the browser.
export default async function CheckoutPage() {
  const [settings, areas] = await Promise.all([getSettings(), getDeliveryAreas()]);
  return (
    <div data-no-dock className="mx-auto max-w-6xl px-4 py-10">
      <PageHeading title="Checkout" intro="Save your order, then confirm it with our pharmacist on WhatsApp or by phone." />
      <div className="mt-8">
        <CheckoutForm
          areas={sortDeliveryOptions(areas)}
          storeAddress={settings.store_address}
          pharmacyOnlyNotice={settings.p_medicine_notice}
        />
      </div>
    </div>
  );
}
