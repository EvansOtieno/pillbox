import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGrid } from "@/components/product-card";
import { PageHeading } from "@/components/sections";
import { PageSkeleton } from "@/components/skeletons";
import { getAllSlugs, getCategory, getCategoryProducts, getSettings } from "@/lib/data/storefront";

// Prerender every category at build time (like a static site generator).
export async function generateStaticParams() {
  const { categories } = await getAllSlugs();
  return categories.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const category = await getCategory((await params).slug);
  return category ? { title: category.name, description: category.description } : {};
}

export default function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Suspense fallback={<PageSkeleton />}>
        <CategoryContent params={params} />
      </Suspense>
    </div>
  );
}

async function CategoryContent({ params }: Pick<PageProps<"/category/[slug]">, "params">) {
  const { slug } = await params;
  const [category, products, settings] = await Promise.all([
    getCategory(slug),
    getCategoryProducts(slug),
    getSettings(),
  ]);
  if (!category) notFound();

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link href="/shop" className="hover:text-brand hover:underline">
          Shop
        </Link>{" "}
        / <span aria-current="page">{category.name}</span>
      </nav>
      <PageHeading title={category.name} intro={category.description} />
      <p className="mt-6 mb-5 text-sm text-muted">
        {products.length} {products.length === 1 ? "product" : "products"}
      </p>
      <ProductGrid products={products} settings={settings} />
    </>
  );
}
