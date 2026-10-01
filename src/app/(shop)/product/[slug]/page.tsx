import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PhoneIcon, WhatsAppIcon } from "@/components/icons";
import { WhenClosed } from "@/components/open-status";
import { ProductGrid } from "@/components/product-card";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import {
  ConsultButton,
  Price,
  ProductImage,
  RxBadge,
  cartProduct,
  consultLink,
} from "@/components/product-bits";
import { Prose } from "@/components/sections";
import { PageSkeleton } from "@/components/skeletons";
import { getAllSlugs, getProduct, getRelatedProducts, getSettings } from "@/lib/data/storefront";
import { telUrl, whatsappUrl } from "@/lib/domain/contact";
import { isPharmacyOnly, isRx } from "@/lib/domain/product-rules";
import { fillTemplate } from "@/lib/domain/template";
import { SITE_URL, hoursFrom } from "@/lib/site";

export async function generateStaticParams() {
  const { products } = await getAllSlugs();
  return products.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  return product ? { title: product.name, description: product.short_description } : {};
}

export default function ProductPage({ params }: PageProps<"/product/[slug]">) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Suspense fallback={<PageSkeleton />}>
        <ProductContent params={params} />
      </Suspense>
    </div>
  );
}

async function ProductContent({ params }: Pick<PageProps<"/product/[slug]">, "params">) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProduct(slug), getSettings()]);
  if (!product) notFound();

  const category = product.categories;
  const related = category ? await getRelatedProducts(category.slug, product.id) : [];
  const consult = consultLink(product, settings);
  const chatHref = whatsappUrl(
    settings.whatsapp_number,
    fillTemplate(settings.consult_message, {
      store: settings.store_name,
      product: product.name,
      url: `${SITE_URL}/product/${product.slug}`,
    }),
  );

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <Link href="/shop" className="hover:text-brand hover:underline">
          Shop
        </Link>
        {category && (
          <>
            {" / "}
            <Link href={`/category/${category.slug}`} className="hover:text-brand hover:underline">
              {category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <ProductImage
          categorySlug={category?.slug ?? ""}
          imagePath={product.image_path}
          alt={product.name}
          sizes="(min-width: 768px) 50vw, 100vw"
          className="aspect-square rounded-3xl md:sticky md:top-6"
        />

        <section aria-labelledby="product-title">
          <div className="flex min-h-6 flex-wrap gap-2">
            <RxBadge rxClass={product.rx_class} />
            {!product.in_stock && (
              <span className="rounded-md bg-mist px-2 py-0.5 text-xs font-bold text-muted">Out of stock</span>
            )}
          </div>
          <h1 id="product-title" className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{product.name}</h1>
          <p className="mt-3 text-lg text-muted">{product.short_description}</p>
          <p className="mt-6 text-3xl">
            <Price product={product} settings={settings} className="text-3xl" />
          </p>

          {isRx(product) && (
            <p className="mt-6 rounded-xl border border-rx/20 bg-rx-bg p-4 text-rx">
              This medicine needs a prescription. Talk to our pharmacist to order it.
            </p>
          )}
          {isPharmacyOnly(product) && product.in_stock && (
            <p className="mt-6 rounded-xl border border-pmed/20 bg-pmed-bg p-4 text-pmed">
              Pharmacy-only medicine: our pharmacist will contact you to confirm before dispatch.
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {consult ? <ConsultButton href={consult.href} label={consult.label} size="lg" /> : (
              <AddToCartButton product={cartProduct(product, category?.slug ?? "")} size="lg" />
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            {!consult && (
              <a href={chatHref} target="_blank" rel="noopener" className="inline-flex items-center gap-2 font-bold text-brand hover:underline">
                <WhatsAppIcon className="size-5" />
                Questions? Chat with a pharmacist
              </a>
            )}
            <a href={telUrl(settings.call_number)} className="inline-flex items-center gap-2 font-bold text-brand hover:underline">
              <PhoneIcon className="size-5" />
              Call {settings.call_number}
            </a>
          </div>
          <WhenClosed hours={hoursFrom(settings)}>
            <p className="mt-3 text-sm text-muted">{settings.after_hours_note}</p>
          </WhenClosed>

          <div className="mt-10 border-t border-line pt-6">
            <h2 className="mb-3 text-lg font-bold">About this product</h2>
            <Prose text={product.description} className="text-muted" />
            <p className="mt-4 text-sm text-muted">Product code {product.sku}</p>
          </div>
        </section>
      </div>

      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="related-title">
          <h2 id="related-title" className="mb-5 text-2xl font-extrabold tracking-tight">
            More in {category?.name}
          </h2>
          <ProductGrid products={related} settings={settings} />
        </section>
      )}
    </>
  );
}
