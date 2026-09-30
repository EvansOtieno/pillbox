"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import * as cart from "./cart-logic";
import type { CartItem, CartProduct } from "./cart-logic";

/*
 * The cart store (Zustand): a small global state container, roughly a singleton bean that components
 * subscribe to. `persist` saves the items to localStorage so the cart survives reloads; the drawer's
 * open/closed state is not saved.
 */

interface CartState {
  items: CartItem[];
  drawerOpen: boolean;
  /** Bumped on every add, so the cart button can replay its "bump" animation. */
  lastAddedAt: number;
  add: (product: CartProduct, qty?: number) => void;
  setQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  updatePrice: (productId: number, priceKes: number) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      drawerOpen: false,
      lastAddedAt: 0,
      add: (product, qty = 1) =>
        set((s) => ({ items: cart.addItem(s.items, product, qty), drawerOpen: true, lastAddedAt: Date.now() })),
      setQty: (productId, qty) => set((s) => ({ items: cart.setQty(s.items, productId, qty) })),
      remove: (productId) => set((s) => ({ items: cart.removeItem(s.items, productId) })),
      updatePrice: (productId, priceKes) => set((s) => ({ items: cart.updatePrice(s.items, productId, priceKes) })),
      clear: () => set({ items: [] }),
      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
    }),
    {
      name: "afya-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
    },
  ),
);
