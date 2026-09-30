import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductGrid } from "@/components/product-card";
import { PageHeading } from "@/components/sections";
import { ShopFilters } from "@/components/shop-filters";
import { GridSkeleton } from "@/components/skeletons";
import { getCategories, getSettings, getShopProducts, type ShopSort } from "@/lib/data/storefront";

export const metadata: Metadata = {
  title: "Shop all products",
  description: "Medicines, vitamins, skin care, baby care and health devices from Afya Corner.",
};

const SORTS: ShopSort[] = ["featured", "price-asc", "price-desc", "name"];

// The heading is part of the prerendered shell; the filtered results depend on the URL and stream in.
export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeading title="Shop all products" />
      <div className="mt-6">
        <Suspense fallback={<GridSkeleton />}>
          <ShopResults searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function ShopResults({ searchParams }: Pick<PageProps<"/shop">, "searchParams">) {
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

  const categories = await getCategories();
  const category = categories.some((c) => c.slug === one(params.category)) ? one(params.category) : undefined;
  const sort = (SORTS as string[]).includes(one(params.sort)) ? (one(params.sort) as ShopSort) : "featured";
  const inStockOnly = one(params.stock) === "1";
  const page = Math.max(1, Number.parseInt(one(params.page), 10) || 1);

  const [settings, result] = await Promise.all([
    getSettings(),
    getShopProducts({ category, inStockOnly, sort, page }),
  ]);

  const pageHref = (n: number) => {
    const query = new URLSearchParams();
    if (category) query.set("category", category);
    if (sort !== "featured") query.set("sort", sort);
    if (inStockOnly) query.set("stock", "1");
    if (n > 1) query.set("page", String(n));
    const qs = query.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };

  return (
    <>
      <ShopFilters categories={categories} value={{ category, inStockOnly, sort }} />
      <p className="mt-4 mb-5 text-sm text-muted" aria-live="polite">
        {result.total} {result.total === 1 ? "product" : "products"}
        {result.pageCount > 1 && `, page ${result.page} of ${result.pageCount}`}
      </p>
      {result.products.length > 0 ? (
        <ProductGrid products={result.products} settings={settings} />
      ) : (
        <p className="rounded-2xl border border-line bg-surface p-8">
          No products match these filters.{" "}
          <Link href="/shop" className="font-bold text-brand underline">
            Show all products
          </Link>
        </p>
      )}
      {result.pageCount > 1 && (
        <nav aria-label="Pages" className="mt-10 flex flex-wrap justify-center gap-2">
          {Array.from({ length: result.pageCount }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={pageHref(n)}
              aria-current={n === result.page ? "page" : undefined}
              className={`flex size-10 items-center justify-center rounded-full border font-bold tabular-nums transition ${
                n === result.page ? "border-brand bg-brand text-white" : "border-line hover:border-brand"
              }`}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
