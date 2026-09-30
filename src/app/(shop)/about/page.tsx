import type { Metadata } from "next";
import { PageHeading, Prose } from "@/components/sections";
import { getSettings } from "@/lib/data/storefront";

export const metadata: Metadata = { title: "About us" };

export default async function AboutPage() {
  const settings = await getSettings();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeading title={`About ${settings.store_name}`} />
      <Prose text={settings.about_text} className="mt-6" />
    </div>
  );
}
