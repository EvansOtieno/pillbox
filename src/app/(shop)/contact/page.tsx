import type { Metadata } from "next";
import { PhoneIcon, WhatsAppIcon } from "@/components/icons";
import { HoursBlock, PageHeading } from "@/components/sections";
import { getSettings } from "@/lib/data/storefront";
import { telUrl, whatsappUrl } from "@/lib/domain/contact";
import { fillTemplate } from "@/lib/domain/template";
import { hoursFrom } from "@/lib/site";

export const metadata: Metadata = { title: "Contact us" };

export default async function ContactPage() {
  const settings = await getSettings();
  const chatHref = whatsappUrl(
    settings.whatsapp_number,
    fillTemplate(settings.general_message, { store: settings.store_name }),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeading title="Contact us" intro="Our pharmacists answer on WhatsApp and by phone during opening hours." />
      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <div className="space-y-4">
          <a
            href={chatHref}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-brand"
          >
            <WhatsAppIcon className="size-7 text-brand" />
            <span>
              <span className="block font-bold">WhatsApp a pharmacist</span>
              <span className="text-muted">Usually the fastest way to reach us</span>
            </span>
          </a>
          <a
            href={telUrl(settings.call_number)}
            className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-brand"
          >
            <PhoneIcon className="size-7 text-brand" />
            <span>
              <span className="block font-bold">Call {settings.call_number}</span>
              <span className="text-muted">During opening hours</span>
            </span>
          </a>
          {settings.public_email && (
            <p>
              Email:{" "}
              <a href={`mailto:${settings.public_email}`} className="font-bold text-brand underline">
                {settings.public_email}
              </a>
            </p>
          )}
        </div>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Visit us</h2>
          <p className="mt-3 text-lg">{settings.store_address}</p>
          {settings.maps_url && (
            <a href={settings.maps_url} target="_blank" rel="noopener" className="mt-2 inline-block font-bold text-brand underline">
              Get directions
            </a>
          )}
          <h2 className="mt-10 mb-3 text-2xl font-extrabold tracking-tight">Opening hours</h2>
          <HoursBlock hours={hoursFrom(settings)} />
        </div>
      </div>
    </div>
  );
}
