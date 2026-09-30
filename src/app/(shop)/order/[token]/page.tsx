import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { PhoneIcon, WhatsAppIcon } from "@/components/icons";
import { WhenClosed } from "@/components/open-status";
import { PageSkeleton } from "@/components/skeletons";
import { getSettings } from "@/lib/data/storefront";
import { formatMsisdnLocal, telUrl, whatsappUrl } from "@/lib/domain/contact";
import { formatFee, formatKes } from "@/lib/domain/money";
import { orderMessage, type OrderForMessage } from "@/lib/domain/whatsapp-message";
import { hoursFrom } from "@/lib/site";
import { createPublicClient } from "@/lib/supabase/public";

export const metadata: Metadata = { title: "Confirm your order", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function OrderPage({ params }: PageProps<"/order/[token]">) {
  return (
    <div data-no-dock className="mx-auto max-w-6xl px-4 py-10">
      <Suspense fallback={<PageSkeleton />}>
        <OrderContent params={params} />
      </Suspense>
    </div>
  );
}

/** What order_by_token() returns (jsonb, so typed by hand). */
type SavedOrder = Omit<OrderForMessage, "items"> & {
  status: string;
  email: string | null;
  items: Array<OrderForMessage["items"][number] & { sku: string; unit_price_kes: number }>;
};

// Not cached: every order is different, and its status can change.
async function getOrder(token: string): Promise<SavedOrder | null> {
  await connection();
  if (!UUID.test(token)) return null;
  const { data, error } = await createPublicClient().rpc("order_by_token", { p_token: token });
  if (error) throw new Error(`Supabase: ${error.message}`);
  return data as unknown as SavedOrder | null;
}

async function OrderContent({ params }: Pick<PageProps<"/order/[token]">, "params">) {
  const { token } = await params;
  const [order, settings] = await Promise.all([getOrder(token), getSettings()]);
  if (!order) notFound();

  const message = orderMessage(order, settings);
  const pickup = order.fulfilment === "pickup";

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_24rem]">
      <section aria-labelledby="confirm-title">
        <p className="inline-flex items-center gap-2 rounded-full bg-mist px-3 py-1 text-sm font-bold text-brand">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Order #{order.number} saved
        </p>
        <h1 id="confirm-title" className="mt-4 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
          One more step: confirm with our pharmacist
        </h1>
        <p className="mt-3 max-w-[60ch] text-lg text-muted">{settings.thankyou_text}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={whatsappUrl(settings.whatsapp_number, message)}
            target="_blank"
            rel="noopener"
            className="inline-flex h-13 items-center gap-2.5 rounded-full bg-brand px-7 text-lg font-bold text-white transition hover:bg-brand-dark active:scale-95"
          >
            <WhatsAppIcon className="size-5.5" />
            Send order on WhatsApp
          </a>
          <a
            href={telUrl(settings.call_number)}
            className="inline-flex h-13 items-center gap-2.5 rounded-full border-2 border-brand px-6 text-lg font-bold text-brand transition hover:bg-brand hover:text-white active:scale-95"
          >
            <PhoneIcon className="size-5" />
            Call {settings.call_number}
          </a>
        </div>
        <p className="mt-4">
          Your order number is <strong>#{order.number}</strong>. Mention it if you call.
        </p>
        <WhenClosed hours={hoursFrom(settings)}>
          <p className="mt-2 text-muted">{settings.after_hours_note}</p>
        </WhenClosed>

        <h2 className="mt-12 mb-3 text-lg font-bold">The message you&apos;ll send</h2>
        {/* Shaped like an outgoing chat message, so it's clear what WhatsApp will open with. */}
        <div className="max-w-lg rounded-2xl rounded-tr-sm bg-[#e7f6ec] p-4 text-[0.95rem] leading-relaxed whitespace-pre-wrap shadow-lift">
          {message}
        </div>
      </section>

      <aside aria-labelledby="details-title" className="h-fit rounded-2xl border border-line bg-surface p-5">
        <h2 id="details-title" className="text-xl font-extrabold tracking-tight">
          Order #{order.number}
        </h2>
        <ul className="mt-4 divide-y divide-line">
          {order.items.map((item) => (
            <li key={item.sku} className="flex justify-between gap-3 py-3">
              <span className="min-w-0">
                <span className="tabular-nums">{item.qty} ×</span> {item.name}
                {item.rx_class === "pharmacy_only" && <span className="block text-xs font-bold text-pmed">Pharmacy-only</span>}
              </span>
              <span className="shrink-0 font-bold tabular-nums">{formatKes(item.line_total_kes)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-line pt-3">
          <div className="flex justify-between">
            <dt>Items</dt>
            <dd className="tabular-nums">{formatKes(order.items_total_kes)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>{pickup ? "Pick-up" : `Delivery (${order.delivery_area})`}</dt>
            <dd className="tabular-nums">{formatFee(order.delivery_fee_kes)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-lg font-extrabold">
            <dt>{pickup ? "To pay at pick-up" : "To pay on delivery"}</dt>
            <dd className="tabular-nums">{formatKes(order.total_kes)}</dd>
          </div>
        </dl>
        <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          <div>
            <dt className="font-bold">Name</dt>
            <dd>{order.customer_name}</dd>
          </div>
          <div>
            <dt className="font-bold">Phone</dt>
            <dd>{formatMsisdnLocal(order.phone)}</dd>
          </div>
          <div>
            <dt className="font-bold">{pickup ? "Pick-up at" : "Deliver to"}</dt>
            <dd>{pickup ? `${settings.store_name}, ${settings.store_address}` : order.address}</dd>
          </div>
          {order.notes && (
            <div>
              <dt className="font-bold">Notes</dt>
              <dd>{order.notes}</dd>
            </div>
          )}
        </dl>
      </aside>
    </div>
  );
}
