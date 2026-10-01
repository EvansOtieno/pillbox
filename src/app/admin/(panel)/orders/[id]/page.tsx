import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminForm, SaveButton } from "@/components/admin/admin-form";
import { StatusBadge, formatDateTime } from "@/components/admin/ui";
import { PhoneIcon, WhatsAppIcon } from "@/components/icons";
import { requireStaff } from "@/lib/admin/auth";
import { getSettings } from "@/lib/data/storefront";
import { formatMsisdnLocal, telUrl, whatsappUrl } from "@/lib/domain/contact";
import { formatFee, formatKes } from "@/lib/domain/money";
import { STATUS_LABEL, STATUS_STEPS, nextMoves } from "@/lib/domain/order-status";
import { customerGreeting } from "@/lib/domain/whatsapp-message";
import { changeOrderStatus } from "../actions";

export const metadata: Metadata = { title: "Order" };

export default async function OrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { supabase } = await requireStaff();
  const { id } = await params;
  const [{ data: order }, { data: items }, settings] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).maybeSingle(),
    supabase.from("order_items").select("*").eq("order_id", id).order("line_no"),
    getSettings(),
  ]);
  if (!order) notFound();

  const pickup = order.fulfilment === "pickup";
  const firstName = order.customer_name.split(" ")[0];
  const stepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <>
      <Link href="/admin/orders" className="text-sm text-muted underline hover:text-brand">
        All orders
      </Link>
      <div className="mt-2 mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Order #{order.number}</h1>
        <StatusBadge status={order.status} />
        <span className="text-muted">placed {formatDateTime(order.created_at)}</span>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-8">
          {/* The workflow is a real sequence, so it's shown as numbered steps. */}
          <section aria-labelledby="progress-title" aria-live="polite" className="rounded-2xl border border-line bg-surface p-5">
            <h2 id="progress-title" className="sr-only">
              Progress
            </h2>
            {order.status === "cancelled" ? (
              <p className="font-bold text-rx">This order was cancelled.</p>
            ) : (
              <ol className="flex flex-wrap items-center gap-2">
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= stepIndex;
                  return (
                    <li key={step} className="flex items-center gap-2" aria-current={i === stepIndex ? "step" : undefined}>
                      <span
                        className={`flex size-8 items-center justify-center rounded-full text-sm font-bold ${
                          done ? "bg-brand text-white" : "border-2 border-line text-muted"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className={done ? "font-bold" : "text-muted"}>{STATUS_LABEL[step]}</span>
                      {i < STATUS_STEPS.length - 1 && <span aria-hidden="true" className="mx-1 h-0.5 w-8 bg-line" />}
                    </li>
                  );
                })}
              </ol>
            )}
            {nextMoves(order.status).length > 0 && (
              <div className="mt-5 flex flex-wrap gap-3 border-t border-line pt-5">
                {nextMoves(order.status).map((move) => (
                  <AdminForm key={move.to} action={changeOrderStatus.bind(null, order.id, move.to)} confirm={move.confirm}>
                    <SaveButton variant={move.to === "cancelled" ? "danger" : "primary"} pendingLabel="Updating…">
                      {move.label}
                    </SaveButton>
                  </AdminForm>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="items-title">
            <h2 id="items-title" className="mb-3 text-lg font-extrabold">
              Items
            </h2>
            <div className="rounded-2xl border border-line bg-surface">
              <ul className="divide-y divide-line">
                {(items ?? []).map((item) => (
                  <li key={item.line_no} className="flex justify-between gap-4 px-5 py-3">
                    <span>
                      <span className="tabular-nums">{item.qty} ×</span> {item.name}
                      <span className="block text-sm text-muted">
                        {item.sku} at {formatKes(item.unit_price_kes)}
                        {item.rx_class === "pharmacy_only" && <strong className="ml-2 text-pmed">Pharmacy-only: confirm with the customer</strong>}
                      </span>
                    </span>
                    <span className="font-bold tabular-nums">{formatKes(item.line_total_kes)}</span>
                  </li>
                ))}
              </ul>
              <dl className="space-y-1 border-t border-line px-5 py-3">
                <div className="flex justify-between">
                  <dt>Items</dt>
                  <dd className="tabular-nums">{formatKes(order.items_total_kes)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>{pickup ? "Pick-up" : `Delivery (${order.delivery_area})`}</dt>
                  <dd className="tabular-nums">{formatFee(order.delivery_fee_kes)}</dd>
                </div>
                <div className="flex justify-between text-lg font-extrabold">
                  <dt>{pickup ? "To collect at pick-up" : "To collect on delivery"}</dt>
                  <dd className="tabular-nums">{formatKes(order.total_kes)}</dd>
                </div>
              </dl>
            </div>
          </section>
        </div>

        <aside aria-labelledby="customer-title" className="h-fit rounded-2xl border border-line bg-surface p-5">
          <h2 id="customer-title" className="text-lg font-extrabold">
            Customer
          </h2>
          <dl className="mt-3 space-y-3">
            <div>
              <dt className="text-sm font-bold text-muted">Name</dt>
              <dd>{order.customer_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-muted">Phone</dt>
              <dd className="tabular-nums">{formatMsisdnLocal(order.phone)}</dd>
            </div>
            {order.email && (
              <div>
                <dt className="text-sm font-bold text-muted">Email</dt>
                <dd>{order.email}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-bold text-muted">{pickup ? "Collects from" : "Deliver to"}</dt>
              <dd>{pickup ? settings.store_address : order.address}</dd>
            </div>
            {order.notes && (
              <div>
                <dt className="text-sm font-bold text-muted">Notes</dt>
                <dd className="whitespace-pre-line">{order.notes}</dd>
              </div>
            )}
          </dl>
          <div className="mt-5 flex flex-col gap-2">
            <a
              href={whatsappUrl(order.phone, customerGreeting(firstName, settings.store_name, order.number))}
              target="_blank"
              rel="noopener"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand font-bold text-white hover:bg-brand-dark"
            >
              <WhatsAppIcon className="size-5" />
              WhatsApp {firstName}
            </a>
            <a
              href={telUrl(order.phone)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line font-bold hover:border-brand hover:text-brand"
            >
              <PhoneIcon className="size-5" />
              Call {firstName}
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}
