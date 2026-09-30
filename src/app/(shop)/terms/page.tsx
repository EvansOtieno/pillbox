import type { Metadata } from "next";
import { PageHeading, Prose } from "@/components/sections";
import { getSettings } from "@/lib/data/storefront";

export const metadata: Metadata = { title: "Terms of service" };

export default async function TermsPage() {
  const settings = await getSettings();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeading title="Terms of service" />
      <Prose text={settings.terms_text} className="mt-6" />
    </div>
  );
}
