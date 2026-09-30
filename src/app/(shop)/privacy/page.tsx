import type { Metadata } from "next";
import { PageHeading, Prose } from "@/components/sections";
import { getSettings } from "@/lib/data/storefront";

export const metadata: Metadata = { title: "Privacy policy" };

export default async function PrivacyPage() {
  const settings = await getSettings();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeading title="Privacy policy" />
      <Prose text={settings.privacy_text} className="mt-6" />
    </div>
  );
}
