"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { itemsTotal, toOrderLines } from "@/lib/cart/cart-logic";
import { useCart } from "@/lib/cart/store";
import { checkoutFieldErrors } from "@/lib/domain/checkout";
import type { DeliveryOption } from "@/lib/domain/delivery";
import { formatFee, formatKes } from "@/lib/domain/money";
import { placeOrder, type PlaceOrderState } from "./actions";

type Fulfilment = "delivery" | "pickup";

// The cart is restored from localStorage after hydration; until then we don't know if it's empty.
const subscribeHydration = (cb: () => void) => useCart.persist.onFinishHydration(cb);
const useCartHydrated = () =>
  useSyncExternalStore(subscribeHydration, () => useCart.persist.hasHydrated(), () => false);

export function CheckoutForm({
  areas,
  storeAddress,
  pharmacyOnlyNotice,
}: {
  areas: DeliveryOption[];
  storeAddress: string;
  pharmacyOnlyNotice: string;
}) {
  const hydrated = useCartHydrated();
  const { items, updatePrice, remove, clear } = useCart();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(placeOrder, { status: "idle" } as PlaceOrderState);

  const deliveryAreas = areas.filter((a) => !a.is_pickup);
  const pickupAreas = areas.filter((a) => a.is_pickup);
  const [fulfilment, setFulfilment] = useState<Fulfilment>(deliveryAreas.length > 0 ? "delivery" : "pickup");
  const [deliveryAreaId, setDeliveryAreaId] = useState<string>("");
  const [pickupAreaId, setPickupAreaId] = useState<string>(pickupAreas[0] ? String(pickupAreas[0].id) : "");
  // Errors found while typing (on blur). "" means "fixed since the last submit", hiding a stale server error.
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const summaryRef = useRef<HTMLDivElement>(null);

  // React to the Server Action's answer (store, focus and navigation are outside React state).
  useEffect(() => {
    if (state.status === "placed") {
      clear();
      router.push(`/order/${state.token}`);
    } else if (state.status === "error") {
      if (state.priceUpdate) updatePrice(state.priceUpdate.productId, state.priceUpdate.priceKes);
      summaryRef.current?.focus();
    }
  }, [state, clear, router, updatePrice]);

  const serverErrors = state.status === "error" ? state.fieldErrors : {};
  const errors: Record<string, string> = { ...serverErrors, ...clientErrors };
  const errorFor = (field: string) => errors[field] || undefined;

  function validateField(form: HTMLFormElement, field: string) {
    if (!field || field === "items") return;
    const fieldErrors = checkoutFieldErrors(Object.fromEntries(new FormData(form)));
    setClientErrors((prev) => ({ ...prev, [field]: fieldErrors[field] ?? "" }));
  }

  if (!hydrated) {
    return <div aria-hidden="true" className="h-96 animate-pulse rounded-2xl bg-mist motion-reduce:animate-none" />;
  }

  if (items.length === 0 && state.status !== "placed") {
    return (
      <div className="max-w-xl rounded-2xl border border-line bg-surface p-8">
        <p className="text-lg font-bold">Your cart is empty.</p>
        <p className="mt-2 text-muted">Add products to your cart, then come back here to choose delivery or pick-up.</p>
        <Link href="/shop" className="mt-5 inline-flex h-11 items-center rounded-full bg-brand px-5 font-bold text-white hover:bg-brand-dark">
          Browse the shop
        </Link>
      </div>
    );
  }

  const selectedArea =
    fulfilment === "pickup"
      ? pickupAreas.find((a) => String(a.id) === pickupAreaId)
      : deliveryAreas.find((a) => String(a.id) === deliveryAreaId);
  const fee = selectedArea?.fee_kes ?? 0;
  const subtotal = itemsTotal(items);
  const blockedId = state.status === "error" ? state.blockedProductId : undefined;
  const summaryErrors = Object.entries(errors).filter(([, message]) => message);
  // Saved and on its way to the confirmation page: keep the button locked so it can't be sent twice.
  const busy = pending || state.status === "placed";

  return (
    <form
      noValidate
      aria-busy={busy}
      // Submitted by hand rather than with the action prop: React resets an action form after every
      // submit, which would wipe what the shopper typed whenever the order is rejected.
      onSubmit={(e) => {
        e.preventDefault();
        setClientErrors({}); // a fresh submit gets a fresh answer from the server
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      // Blur and change bubble up from the fields, so one handler on the form covers them all.
      onBlur={(e) => {
        const name = fieldName(e.target);
        if (name) validateField(e.currentTarget, name);
      }}
      onChange={(e) => {
        const name = fieldName(e.target);
        // Once a field has an error, re-check it as the shopper fixes it.
        if (name && errors[name]) validateField(e.currentTarget, name);
      }}
      className="grid gap-10 lg:grid-cols-[1fr_24rem]"
    >
      <input type="hidden" name="items" value={JSON.stringify(toOrderLines(items))} />

      <div className="min-w-0 space-y-10">
        {state.status === "error" && (
          <div ref={summaryRef} tabIndex={-1} role="alert" aria-labelledby="error-title" className="rounded-2xl border-2 border-rx bg-rx-bg p-5 text-rx">
            <h2 id="error-title" className="font-extrabold">
              Your order was not placed
            </h2>
            <p className="mt-1">{state.message}</p>
            {summaryErrors.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {summaryErrors.map(([field, message]) => (
                  <li key={field}>
                    <a href={`#${field}`} className="font-bold underline">
                      {message}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <fieldset className="space-y-5">
          <legend className="mb-4 text-xl font-extrabold tracking-tight">Your details</legend>
          <Field id="customer_name" label="Full name" error={errorFor("customer_name")}>
            <input id="customer_name" name="customer_name" autoComplete="name" required maxLength={100} {...fieldProps("customer_name", errorFor)} />
          </Field>
          <Field id="phone" label="Phone (WhatsApp preferred)" hint="A Kenyan mobile number, e.g. 0712 345 678" error={errorFor("phone")}>
            <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required {...fieldProps("phone", errorFor, "phone-hint")} />
          </Field>
          <Field id="email" label="Email (optional)" hint="For a copy of your order" error={errorFor("email")}>
            <input id="email" name="email" type="email" inputMode="email" autoComplete="email" {...fieldProps("email", errorFor, "email-hint")} />
          </Field>
        </fieldset>

        <fieldset>
          <legend className="mb-4 text-xl font-extrabold tracking-tight">Delivery or pick-up</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {deliveryAreas.length > 0 && (
              <ChoiceCard
                name="fulfilment"
                value="delivery"
                checked={fulfilment === "delivery"}
                onChange={() => setFulfilment("delivery")}
                title="Delivery"
                detail={`Across Nairobi, from ${formatKes(Math.min(...deliveryAreas.map((a) => a.fee_kes)))}`}
              />
            )}
            {pickupAreas.length > 0 && (
              <ChoiceCard
                name="fulfilment"
                value="pickup"
                checked={fulfilment === "pickup"}
                onChange={() => setFulfilment("pickup")}
                title="Pick-up"
                detail={`Free, from ${storeAddress}`}
              />
            )}
          </div>

          {fulfilment === "delivery" ? (
            <div className="mt-6 space-y-5">
              <Field id="delivery_area_id" label="Delivery area" error={errorFor("delivery_area_id")}>
                <select
                  id="delivery_area_id"
                  name="delivery_area_id"
                  required
                  value={deliveryAreaId}
                  onChange={(e) => setDeliveryAreaId(e.target.value)}
                  {...fieldProps("delivery_area_id", errorFor)}
                >
                  <option value="" disabled>
                    Choose your area
                  </option>
                  {deliveryAreas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}: {formatFee(a.fee_kes)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="address" label="Delivery address" hint="Street, building, house or apartment number, landmark" error={errorFor("address")}>
                <textarea id="address" name="address" rows={3} required maxLength={300} autoComplete="street-address" {...fieldProps("address", errorFor, "address-hint")} />
              </Field>
            </div>
          ) : (
            <div className="mt-6">
              {pickupAreas.length > 1 ? (
                <Field id="delivery_area_id" label="Pick-up point" error={errorFor("delivery_area_id")}>
                  <select id="delivery_area_id" name="delivery_area_id" value={pickupAreaId} onChange={(e) => setPickupAreaId(e.target.value)} {...fieldProps("delivery_area_id", errorFor)}>
                    {pickupAreas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                <>
                  <input type="hidden" name="delivery_area_id" value={pickupAreaId} />
                  <p className="rounded-xl bg-mist p-4">
                    Collect your order at <strong>{storeAddress}</strong>. We&apos;ll message you when it&apos;s ready.
                  </p>
                </>
              )}
            </div>
          )}
        </fieldset>

        <Field id="notes" label="Notes (optional)" hint="Allergies, directions for the rider, best time to call" error={errorFor("notes")}>
          <textarea id="notes" name="notes" rows={3} maxLength={500} {...fieldProps("notes", errorFor, "notes-hint")} />
        </Field>
      </div>

      <aside aria-labelledby="summary-title" className="h-fit rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-6">
        <h2 id="summary-title" className="text-xl font-extrabold tracking-tight">
          Order summary
        </h2>
        <ul className="mt-4 divide-y divide-line">
          {items.map((item) => (
            <li key={item.productId} className={`py-3 ${item.productId === blockedId ? "-mx-2 rounded-lg bg-rx-bg px-2" : ""}`}>
              <div className="flex justify-between gap-3">
                <span className="min-w-0">
                  <span className="tabular-nums">{item.qty} ×</span> {item.name}
                  {item.rxClass === "pharmacy_only" && <span className="block text-xs font-bold text-pmed">Pharmacy-only</span>}
                </span>
                <span className="shrink-0 font-bold tabular-nums">{formatKes(item.priceKes * item.qty)}</span>
              </div>
              {item.productId === blockedId && (
                <button type="button" onClick={() => remove(item.productId)} className="mt-1 text-sm font-bold text-rx underline">
                  Remove from order
                </button>
              )}
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-line pt-3">
          <div className="flex justify-between">
            <dt>Items</dt>
            <dd className="tabular-nums">{formatKes(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{fulfilment === "pickup" ? "Pick-up" : "Delivery"}</dt>
            <dd className="tabular-nums">{selectedArea ? formatFee(fee) : "Choose an area"}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-lg font-extrabold">
            <dt>Total to pay</dt>
            <dd className="tabular-nums">{formatKes(subtotal + fee)}</dd>
          </div>
        </dl>
        {items.some((i) => i.rxClass === "pharmacy_only") && (
          <p className="mt-4 rounded-lg bg-pmed-bg px-3 py-2 text-sm text-pmed">{pharmacyOnlyNotice}</p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand font-bold text-white transition hover:bg-brand-dark active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
        >
          {busy && (
            <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />
          )}
          {state.status === "placed" ? "Opening your order…" : pending ? "Placing your order…" : "Place order"}
        </button>
        <p className="mt-3 text-center text-sm text-muted">
          You pay {fulfilment === "pickup" ? "at pick-up" : "on delivery"}, by M-Pesa or cash. Nothing is charged online.
        </p>
      </aside>
    </form>
  );
}

function fieldName(target: EventTarget): string | undefined {
  return target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement
    ? target.name
    : undefined;
}

const INPUT =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-base transition-colors focus-visible:border-brand aria-invalid:border-rx aria-invalid:bg-rx-bg/40";

function fieldProps(id: string, errorFor: (f: string) => string | undefined, hintId?: string) {
  const error = errorFor(id);
  const describedBy = [error ? `${id}-error` : "", hintId ?? ""].filter(Boolean).join(" ") || undefined;
  return { className: INPUT, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy };
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-bold">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="-mt-1 mb-1.5 text-sm text-muted">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-bold text-rx">
          {error}
        </p>
      )}
    </div>
  );
}

function ChoiceCard({
  name,
  value,
  checked,
  onChange,
  title,
  detail,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  detail: string;
}) {
  return (
    <label
      className={`flex cursor-pointer gap-3 rounded-2xl border-2 p-4 transition-colors has-focus-visible:outline-3 has-focus-visible:outline-cross ${
        checked ? "border-brand bg-mist" : "border-line bg-surface hover:border-brand/50"
      }`}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="mt-1 size-4 accent-brand" />
      <span>
        <span className="block font-bold">{title}</span>
        <span className="text-sm text-muted">{detail}</span>
      </span>
    </label>
  );
}
