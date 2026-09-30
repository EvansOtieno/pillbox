import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { settingsFromRows, type Settings } from "@/lib/settings/schema";
import { TAGS } from "./tags";

/*
 * Cached storefront reads. Everything here is public data, the same for every visitor, so each
 * function is 'use cache' with the longest lifetime ('max') and a tag. Pages built from these are
 * prerendered; when staff save in the admin, the tag is revalidated and the pages rebuild.
 * Errors throw: a failed read must not be cached as "empty".
 */

const PAGE_SIZE = 24;

const CARD_FIELDS = "id, slug, name, short_description, price_kes, rx_class, in_stock, image_path";

export type ProductCard = Awaited<ReturnType<typeof getFeaturedProducts>>[number];
export type ShopSort = "featured" | "price-asc" | "price-desc" | "name";

type Result = { data: unknown; error: { message: string } | null };

function check<R extends Result>(result: R): NonNullable<R["data"]> {
  if (result.error) throw new Error(`Supabase: ${result.error.message}`);
  return result.data as NonNullable<R["data"]>;
}

/** For .maybeSingle(): null when the row does not exist. */
function checkMaybe<R extends Result>(result: R): R["data"] {
  if (result.error) throw new Error(`Supabase: ${result.error.message}`);
  return result.data;
}

export async function getSettings(): Promise<Settings> {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.settings);
  const rows = check(await createPublicClient().from("settings").select("key, value"));
  return settingsFromRows(rows);
}

export async function getCategories() {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.catalogue);
  const rows = check(
    await createPublicClient()
      .from("categories")
      .select("id, slug, name, description, image_path, products(count)")
      .order("sort_order"),
  );
  return rows.map(({ products, ...c }) => ({ ...c, productCount: products[0]?.count ?? 0 }));
}

export async function getCategory(slug: string) {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.catalogue);
  return checkMaybe(
    await createPublicClient()
      .from("categories")
      .select("id, slug, name, description")
      .eq("slug", slug)
      .maybeSingle(),
  );
}

export async function getFeaturedProducts(limit: number) {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.catalogue);
  const db = createPublicClient();
  const featured = check(
    await db
      .from("products")
      .select(`${CARD_FIELDS}, categories(slug)`)
      .eq("featured", true)
      .order("name")
      .limit(limit),
  );
  if (featured.length > 0 || limit === 0) return featured;
  // Nothing marked as featured: show the newest products instead.
  return check(
    await db
      .from("products")
      .select(`${CARD_FIELDS}, categories(slug)`)
      .order("created_at", { ascending: false })
      .limit(limit),
  );
}

export async function getShopProducts(filters: {
  category?: string;
  inStockOnly?: boolean;
  sort?: ShopSort;
  page?: number;
}) {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.catalogue);
  const page = Math.max(1, filters.page ?? 1);
  let query = createPublicClient()
    .from("products")
    .select(`${CARD_FIELDS}, categories!inner(slug)`, { count: "exact" });
  if (filters.category) query = query.eq("categories.slug", filters.category);
  if (filters.inStockOnly) query = query.eq("in_stock", true);
  switch (filters.sort) {
    case "price-asc":
      query = query.order("price_kes").order("name");
      break;
    case "price-desc":
      query = query.order("price_kes", { ascending: false }).order("name");
      break;
    case "name":
      query = query.order("name");
      break;
    default:
      query = query.order("featured", { ascending: false }).order("in_stock", { ascending: false }).order("name");
  }
  const result = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const products = check(result);
  const total = result.count ?? 0;
  return { products, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getCategoryProducts(categorySlug: string) {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.catalogue);
  return check(
    await createPublicClient()
      .from("products")
      .select(`${CARD_FIELDS}, categories!inner(slug)`)
      .eq("categories.slug", categorySlug)
      .order("in_stock", { ascending: false })
      .order("name"),
  );
}

export async function getProduct(slug: string) {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.catalogue, TAGS.product(slug));
  return checkMaybe(
    await createPublicClient()
      .from("products")
      .select(`${CARD_FIELDS}, sku, description, categories(slug, name)`)
      .eq("slug", slug)
      .maybeSingle(),
  );
}

export async function getRelatedProducts(categorySlug: string, excludeId: number, limit = 4) {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.catalogue);
  return check(
    await createPublicClient()
      .from("products")
      .select(`${CARD_FIELDS}, categories!inner(slug)`)
      .eq("categories.slug", categorySlug)
      .eq("in_stock", true)
      .neq("id", excludeId)
      .order("featured", { ascending: false })
      .order("name")
      .limit(limit),
  );
}

/** Slugs for prerendering every product and category page at build time. */
export async function getAllSlugs() {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.catalogue);
  const db = createPublicClient();
  const [products, categories] = await Promise.all([
    db.from("products").select("slug"),
    db.from("categories").select("slug"),
  ]);
  return {
    products: check(products).map((p) => p.slug),
    categories: check(categories).map((c) => c.slug),
  };
}

export async function searchProducts(query: string) {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.catalogue);
  const q = query.trim().slice(0, 100);
  if (!q) return [];
  const rows = check(await createPublicClient().rpc("search_products", { p_query: q, p_limit: 48 }));
  // search_products returns bare product rows; attach the category slug for the card icon.
  const categories = await getCategories();
  const slugById = new Map(categories.map((c) => [c.id, c.slug]));
  return rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    short_description: p.short_description,
    price_kes: p.price_kes,
    rx_class: p.rx_class,
    in_stock: p.in_stock,
    image_path: p.image_path,
    categories: { slug: slugById.get(p.category_id) ?? "" },
  }));
}

export async function getDeliveryAreas() {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.delivery);
  return check(
    await createPublicClient()
      .from("delivery_areas")
      .select("id, name, fee_kes, is_pickup")
      .eq("active", true)
      .order("sort_order"),
  );
}

export async function getFaqs() {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.faqs);
  return check(
    await createPublicClient().from("faqs").select("id, question, answer").order("sort_order"),
  );
}
