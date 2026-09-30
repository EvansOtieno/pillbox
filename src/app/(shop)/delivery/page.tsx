import type { Metadata } from "next";
import { DeliveryFeeTable, PageHeading, Prose } from "@/components/sections";
import { getDeliveryAreas, getSettings } from "@/lib/data/storefront";

export const metadata: Metadata = {
  title: "Delivery and pick-up",
  description: "Delivery fees across Nairobi, delivery times and free pick-up from Afya Corner.",
};

export default async function DeliveryPage() {
  const [settings, areas] = await Promise.all([getSettings(), getDeliveryAreas()]);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeading title="Delivery and pick-up" />
      <Prose text={settings.delivery_intro} className="mt-6" />

      <div className="mt-10 grid gap-12 md:grid-cols-2">
        <section aria-labelledby="fees-title">
          <h2 id="fees-title" className="mb-4 text-2xl font-extrabold tracking-tight">
            Delivery fees
          </h2>
          <DeliveryFeeTable areas={areas} />
        </section>
        <section aria-labelledby="times-title">
          <h2 id="times-title" className="mb-4 text-2xl font-extrabold tracking-tight">
            When we deliver
          </h2>
          <Prose text={settings.delivery_times} />
          <h2 className="mt-10 mb-3 text-2xl font-extrabold tracking-tight">Pick-up</h2>
          <p className="text-[1.0625rem]">
            Collect your order for free from {settings.store_name}, {settings.store_address}.
          </p>
        </section>
      </div>
    </div>
  );
}
