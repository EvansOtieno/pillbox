import Link from "next/link";
import { ConsultButton } from "@/components/product-bits";
import { ProductGrid } from "@/components/product-card";
import { DeliveryFeeTable, HoursBlock } from "@/components/sections";
import { SearchForm } from "@/components/site-header";
import { CategoryIcon, PhoneIcon } from "@/components/icons";
import { OpenBadge, StoreCross } from "@/components/open-status";
import { getCategories, getDeliveryAreas, getFeaturedProducts, getSettings } from "@/lib/data/storefront";
import { telUrl, whatsappUrl } from "@/lib/domain/contact";
import { deliverySummary } from "@/lib/domain/delivery";
import { fillTemplate } from "@/lib/domain/template";
import { hoursFrom } from "@/lib/site";

export default async function HomePage() {
  const settings = await getSettings();
  const [categories, featured, areas] = await Promise.all([
    getCategories(),
    getFeaturedProducts(settings.featured_count),
    getDeliveryAreas(),
  ]);
  const hours = hoursFrom(settings);
  const chatHref = whatsappUrl(
    settings.whatsapp_number,
    fillTemplate(settings.general_message, { store: settings.store_name }),
  );

  return (
    <>
      {/* Hero: search first, and the pharmacy sign that lights up while we're open */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr] md:py-16">
          <div>
            <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {settings.hero_title}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">{settings.hero_text}</p>
            <div data-home-search className="mt-8 max-w-xl">
              <SearchForm id="home-search" placeholder={settings.search_placeholder} />
            </div>
            <ul className="mt-8 grid gap-2 text-[0.95rem] sm:grid-cols-1">
              {settings.trust_points.map((point) => (
                <li key={point} className="flex items-start gap-2.5">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-cross" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-ink p-8 text-white">
            <StoreCross hours={hours} className="size-24 sm:size-28" offClassName="text-white/15" />
            <p className="mt-6 text-2xl font-extrabold tracking-tight">{settings.store_name}</p>
            <p className="mt-1 text-white/70">{settings.store_address}</p>
            <OpenBadge hours={hours} className="mt-5 inline-flex text-lg font-bold" />
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/shop"
                className="inline-flex h-11 items-center rounded-full bg-white px-5 font-bold text-ink transition hover:bg-mist active:scale-95"
              >
                {settings.hero_button}
              </Link>
              <a
                href={telUrl(settings.call_number)}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/30 px-5 font-bold transition hover:border-white active:scale-95"
              >
                <PhoneIcon className="size-4.5" />
                {settings.call_number}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Categories as shelves: one row per aisle, not a grid of identical cards */}
      <section className="mx-auto max-w-6xl px-4 pt-14" aria-labelledby="categories-title">
        <h2 id="categories-title" className="text-2xl font-extrabold tracking-tight">
          {settings.categories_title}
        </h2>
        <ul className="mt-5 grid border-t border-line md:grid-cols-2 md:gap-x-10">
          {categories.map((category) => (
            <li key={category.id} className="border-b border-line">
              <Link
                href={`/category/${category.slug}`}
                className="group flex items-center gap-4 py-4 transition-colors hover:text-brand"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-mist text-brand transition-transform group-hover:-rotate-6">
                  <CategoryIcon slug={category.slug} className="size-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{category.name}</span>
                  <span className="block truncate text-sm text-muted">{category.description}</span>
                </span>
                <span className="text-sm text-muted tabular-nums">{category.productCount}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-16" aria-labelledby="featured-title">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="featured-title" className="text-2xl font-extrabold tracking-tight">
              {settings.featured_title}
            </h2>
            <Link href="/shop" className="font-bold text-brand hover:underline">
              See all products
            </Link>
          </div>
          <div className="mt-5">
            <ProductGrid products={featured} settings={settings} />
          </div>
        </section>
      )}

      {/* Delivery and hours, straight from the database */}
      <section className="mx-auto mt-16 grid max-w-6xl gap-10 px-4 md:grid-cols-2" aria-label="Delivery and opening hours">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Delivery across Nairobi</h2>
          <p className="mt-2 text-muted">{deliverySummary(areas)}</p>
          <div className="mt-5">
            <DeliveryFeeTable areas={areas.slice(0, 6)} />
          </div>
          <Link href="/delivery" className="mt-4 inline-block font-bold text-brand hover:underline">
            See all delivery fees
          </Link>
        </div>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Opening hours</h2>
          <div className="mt-4">
            <HoursBlock hours={hours} />
          </div>
          <p className="mt-4 text-muted">{settings.store_address}</p>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4" aria-labelledby="consult-title">
        <div className="rounded-3xl border border-line bg-surface p-8 md:flex md:items-center md:justify-between md:gap-10">
          <div className="max-w-xl">
            <h2 id="consult-title" className="text-2xl font-extrabold tracking-tight">
              {settings.consult_title}
            </h2>
            <p className="mt-2 text-muted">{settings.consult_text}</p>
          </div>
          <div className="mt-6 flex shrink-0 flex-wrap gap-2 md:mt-0">
            <ConsultButton href={chatHref} label="Chat on WhatsApp" size="lg" />
          </div>
        </div>
      </section>
    </>
  );
}
