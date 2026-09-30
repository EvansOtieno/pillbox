import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductGrid } from "@/components/product-card";
import { SearchForm } from "@/components/site-header";
import { GridSkeleton } from "@/components/skeletons";
import { getSettings, searchProducts } from "@/lib/data/storefront";
import { whatsappUrl } from "@/lib/domain/contact";
import { fillTemplate } from "@/lib/domain/template";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Suspense fallback={<GridSkeleton />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SearchResults({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw ?? "").trim();
  const [settings, results] = await Promise.all([getSettings(), searchProducts(q)]);
  const askHref = whatsappUrl(
    settings.whatsapp_number,
    fillTemplate(settings.stock_message, { store: settings.store_name, product: q, url: "" }).replace(/\s*\(\)\s*$/, ""),
  );

  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        {q ? `Results for “${q}”` : "Search products"}
      </h1>
      <div className="mt-5 max-w-xl">
        <SearchForm id="page-search" placeholder={settings.search_placeholder} defaultValue={q} />
      </div>

      {q && (
        <div className="mt-8">
          {results.length > 0 ? (
            <>
              <p className="mb-5 text-sm text-muted" aria-live="polite">
                {results.length} {results.length === 1 ? "product" : "products"}
              </p>
              <ProductGrid products={results} settings={settings} />
            </>
          ) : (
            <div className="max-w-xl rounded-2xl border border-line bg-surface p-6">
              <p className="font-bold">No products match “{q}”.</p>
              <p className="mt-2 text-muted">
                Check the spelling, try the medicine&apos;s generic name, or{" "}
                <Link href="/shop" className="font-bold text-brand underline">
                  browse all products
                </Link>
                . We may also have it in the pharmacy:{" "}
                <a href={askHref} target="_blank" rel="noopener" className="font-bold text-brand underline">
                  ask a pharmacist on WhatsApp
                </a>
                .
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
