"use client";

import { itemCount } from "@/lib/cart/cart-logic";
import { useCart } from "@/lib/cart/store";
import { CartIcon } from "../icons";

/** Dock button that opens the cart drawer; the count badge "bumps" whenever something is added. */
export function CartButton() {
  const count = useCart((s) => itemCount(s.items));
  const lastAddedAt = useCart((s) => s.lastAddedAt);
  const openDrawer = useCart((s) => s.openDrawer);

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
      className="relative flex h-12 items-center justify-center gap-2 rounded-full border border-line px-5 font-bold transition hover:border-brand hover:text-brand active:scale-95"
    >
      <CartIcon className="size-5" />
      <span className="max-sm:sr-only">Cart</span>
      {count > 0 && (
        <span
          // A new key remounts the badge, replaying the bump animation.
          key={lastAddedAt}
          className={`${lastAddedAt > 0 ? "cart-bump" : ""} absolute -top-1.5 -right-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-white tabular-nums`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
