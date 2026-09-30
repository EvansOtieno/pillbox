"use client";

import { useRef, useState } from "react";
import type { CartProduct } from "@/lib/cart/cart-logic";
import { useCart } from "@/lib/cart/store";

/** Adds one to the cart and opens the drawer; the label briefly confirms with "Added". */
export function AddToCartButton({ product, size = "md" }: { product: CartProduct; size?: "md" | "lg" }) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function handleClick() {
    add(product);
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1400);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-full bg-brand font-bold text-white transition hover:bg-brand-dark active:scale-95 ${
        size === "lg" ? "h-12 min-w-44 px-8" : "h-11 min-w-28 px-4 text-sm"
      }`}
    >
      {/* Both labels share the space; the swap slides vertically. */}
      <span className={`transition duration-300 ${added ? "-translate-y-8 opacity-0" : ""}`}>Add to cart</span>
      <span
        aria-hidden={!added}
        className={`absolute inset-0 flex items-center justify-center gap-1.5 transition duration-300 ${
          added ? "" : "translate-y-8 opacity-0"
        }`}
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Added
      </span>
      <span className="sr-only" aria-live="polite">
        {added ? `${product.name} added to cart` : ""}
      </span>
    </button>
  );
}
