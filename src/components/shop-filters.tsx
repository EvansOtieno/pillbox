"use client";

import type { ShopSort } from "@/lib/data/storefront";

/**
 * Plain GET form, so filters are shareable URLs and work without JavaScript (the Apply button).
 * With JavaScript, changing any control applies it straight away.
 */
export function ShopFilters({
  categories,
  value,
}: {
  categories: Array<{ slug: string; name: string }>;
  value: { category?: string; inStockOnly: boolean; sort: ShopSort };
}) {
  const apply = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => e.currentTarget.form?.requestSubmit();

  return (
    <form action="/shop" className="flex flex-wrap items-end gap-x-5 gap-y-3 border-y border-line py-4">
      <label className="grid gap-1 text-sm font-bold">
        Category
        <select
          name="category"
          defaultValue={value.category ?? ""}
          onChange={apply}
          className="h-10 rounded-lg border border-line bg-surface px-3 font-normal"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Sort by
        <select
          name="sort"
          defaultValue={value.sort}
          onChange={apply}
          className="h-10 rounded-lg border border-line bg-surface px-3 font-normal"
        >
          <option value="featured">Popular first</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="name">Name</option>
        </select>
      </label>
      <label className="flex h-10 items-center gap-2 text-sm font-bold">
        <input
          type="checkbox"
          name="stock"
          value="1"
          defaultChecked={value.inStockOnly}
          onChange={apply}
          className="size-4 accent-brand"
        />
        In stock only
      </label>
      <button
        type="submit"
        className="h-10 rounded-full border border-line px-4 text-sm font-bold transition hover:border-brand active:scale-95"
      >
        Apply
      </button>
    </form>
  );
}
