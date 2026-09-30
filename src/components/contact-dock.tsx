import { getSettings } from "@/lib/data/storefront";
import { telUrl, whatsappUrl } from "@/lib/domain/contact";
import { fillTemplate } from "@/lib/domain/template";
import { hoursFrom } from "@/lib/site";
import { PhoneIcon, WhatsAppIcon } from "./icons";
import { WhenClosed } from "./open-status";

/**
 * Floating dock, always within thumb reach: WhatsApp and Call (the cart button joins in Milestone 3).
 * Outside opening hours a note explains when the pharmacists reply.
 */
export async function ContactDock() {
  const settings = await getSettings();
  const message = fillTemplate(settings.general_message, { store: settings.store_name });

  return (
    <aside
      aria-label="Contact a pharmacist"
      className="fixed inset-x-3 bottom-3 z-40 flex flex-col items-stretch gap-2 md:inset-x-auto md:right-5 md:bottom-5 md:items-end"
    >
      <WhenClosed hours={hoursFrom(settings)}>
        <p className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-muted shadow-lift md:max-w-72">
          {settings.after_hours_note}
        </p>
      </WhenClosed>
      <div className="flex gap-2 rounded-full border border-line bg-surface/95 p-1.5 shadow-lift backdrop-blur">
        <a
          href={whatsappUrl(settings.whatsapp_number, message)}
          target="_blank"
          rel="noopener"
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand px-5 font-bold text-white transition hover:bg-brand-dark active:scale-95"
        >
          <WhatsAppIcon className="size-5" />
          WhatsApp
        </a>
        <a
          href={telUrl(settings.call_number)}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-line px-5 font-bold transition hover:border-brand hover:text-brand active:scale-95"
        >
          <PhoneIcon className="size-5" />
          Call
        </a>
      </div>
    </aside>
  );
}
