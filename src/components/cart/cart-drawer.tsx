"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { itemsTotal, type CartItem } from "@/lib/cart/cart-logic";
import { useCart } from "@/lib/cart/store";
import { formatKes } from "@/lib/domain/money";
import { CategoryIcon, CloseIcon } from "../icons";

/**
 * Slide-out cart. A native <dialog> opened with showModal() gives focus trapping, Escape to close,
 * an inert page behind it and focus returned to the opener, without extra code. The slide comes from
 * CSS: `starting:` styles apply on the first frame after opening, so the panel transitions in.
 */
export function CartDrawer({ pharmacyOnlyNotice }: { pharmacyOnlyNotice: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { items, drawerOpen, closeDrawer, setQty, remove } = useCart();

  // Keep the dialog element in step with the store (an external system, so an effect is right here).
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (drawerOpen && !el.open) el.showModal();
    if (!drawerOpen && el.open) el.close();
  }, [drawerOpen]);

  const total = itemsTotal(items);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="cart-title"
      onClose={closeDrawer}
      // Clicking the backdrop (the dialog element itself, outside the panel) closes it.
      onClick={(e) => e.target === e.currentTarget && closeDrawer()}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-md bg-surface p-0 text-ink shadow-lift transition-[translate,overlay,display] transition-discrete duration-300 ease-out backdrop:bg-ink/40 backdrop:transition-opacity backdrop:duration-300 starting:open:translate-x-full starting:open:backdrop:opacity-0 not-open:translate-x-full"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="cart-title" className="text-xl font-extrabold tracking-tight">
            Your cart
          </h2>
          <button
            type="button"
            onClick={closeDrawer}
            className="flex size-11 items-center justify-center rounded-full hover:bg-mist"
            aria-label="Close cart"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-start gap-4 px-5 py-8">
            <p className="text-lg">Your cart is empty.</p>
            <Link
              href="/shop"
              onClick={closeDrawer}
              className="inline-flex h-11 items-center rounded-full bg-brand px-5 font-bold text-white hover:bg-brand-dark"
            >
              Browse the shop
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {items.map((item) => (
                <CartLine key={item.productId} item={item} onQty={setQty} onRemove={remove} onNavigate={closeDrawer} />
              ))}
            </ul>
            <div className="border-t border-line px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {items.some((i) => i.rxClass === "pharmacy_only") && (
                <p className="mb-3 rounded-lg bg-pmed-bg px-3 py-2 text-sm text-pmed">{pharmacyOnlyNotice}</p>
              )}
              <p className="flex items-baseline justify-between text-lg">
                <span>Items</span>
                <span className="font-extrabold tabular-nums">{formatKes(total)}</span>
              </p>
              <p className="mt-1 text-sm text-muted">Delivery fee is added at checkout. You pay on delivery or at pick-up.</p>
              <Link
                href="/checkout"
                onClick={closeDrawer}
                className="mt-4 flex h-12 items-center justify-center rounded-full bg-brand font-bold text-white transition hover:bg-brand-dark active:scale-[0.98]"
              >
                Go to checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}

function CartLine({
  item,
  onQty,
  onRemove,
  onNavigate,
}: {
  item: CartItem;
  onQty: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
  onNavigate: () => void;
}) {
  return (
    <li className="flex gap-3 py-4">
      <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-mist text-brand/70">
        <CategoryIcon slug={item.categorySlug} className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <Link href={`/product/${item.slug}`} onClick={onNavigate} className="leading-snug font-bold hover:underline">
          {item.name}
        </Link>
        {item.rxClass === "pharmacy_only" && <p className="text-xs font-bold text-pmed">Pharmacy-only</p>}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center rounded-full border border-line" role="group" aria-label={`Quantity of ${item.name}`}>
            <button
              type="button"
              onClick={() => onQty(item.productId, item.qty - 1)}
              className="flex size-11 items-center justify-center rounded-full text-lg hover:bg-mist"
              aria-label={item.qty === 1 ? `Remove ${item.name}` : `One less ${item.name}`}
            >
              −
            </button>
            <span className="w-8 text-center font-bold tabular-nums" aria-live="polite">
              {item.qty}
            </span>
            <button
              type="button"
              onClick={() => onQty(item.productId, item.qty + 1)}
              disabled={item.qty >= 99}
              className="flex size-11 items-center justify-center rounded-full text-lg hover:bg-mist disabled:opacity-40"
              aria-label={`One more ${item.name}`}
            >
              +
            </button>
          </div>
          <span className="font-bold tabular-nums">{formatKes(item.priceKes * item.qty)}</span>
        </div>
        <button type="button" onClick={() => onRemove(item.productId)} className="mt-1 min-h-11 text-sm text-muted underline hover:text-rx">
          Remove
        </button>
      </div>
    </li>
  );
}
