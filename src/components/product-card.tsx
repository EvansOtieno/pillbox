import Link from "next/link";
import type { ProductCard as ProductCardData } from "@/lib/data/storefront";
import type { Settings } from "@/lib/settings/schema";
import { AddToCartButton, ConsultButton, Price, ProductImage, RxBadge, StockNote, consultLink } from "./product-bits";

export function ProductCard({ product, settings }: { product: ProductCardData; settings: Settings }) {
  const consult = consultLink(product, settings);
  const categorySlug = product.categories?.slug ?? "";

  return (
    <article className="relative flex h-full flex-col rounded-2xl border border-line bg-surface p-3 transition-colors hover:border-brand/50">
      <ProductImage categorySlug={categorySlug} className="aspect-[16/9] rounded-xl" />
      <div className="mt-3 flex min-h-6 flex-wrap items-center gap-2">
        <RxBadge rxClass={product.rx_class} />
        <StockNote inStock={product.in_stock} />
      </div>
      <h3 className="mt-1.5 leading-snug font-bold">
        {/* The whole card is clickable via this link's ::after; buttons sit above it. */}
        <Link href={`/product/${product.slug}`} className="after:absolute after:inset-0 after:rounded-2xl hover:underline">
          {product.name}
        </Link>
      </h3>
      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <Price product={product} settings={settings} />
        <div className="relative z-10">
          {consult ? <ConsultButton href={consult.href} label={consult.label} /> : <AddToCartButton />}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, settings }: { products: ProductCardData[]; settings: Settings }) {
  return (
    <ul className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <li key={product.id} className="flex">
          <div className="w-full">
            <ProductCard product={product} settings={settings} />
          </div>
        </li>
      ))}
    </ul>
  );
}
