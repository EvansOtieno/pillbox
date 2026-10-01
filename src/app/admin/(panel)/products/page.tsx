import type { Metadata } from "next";
import Link from "next/link";
import { AdminForm, FieldError, SaveButton } from "@/components/admin/admin-form";
import { AdminHeading, EmptyState, INPUT } from "@/components/admin/ui";
import { RxBadge } from "@/components/product-bits";
import { requireStaff } from "@/lib/admin/auth";
import { quickUpdateProduct } from "./actions";

export const metadata: Metadata = { title: "Products" };

const PAGE_SIZE = 40;

export default async function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const { supabase } = await requireStaff();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const category = typeof params.category === "string" ? params.category : "";
  const page = Math.max(1, Number(params.page) || 1);

  const { data: categories } = await supabase.from("categories").select("id, name").order("sort_order");
  let query = supabase
    .from("products")
    .select("id, sku, slug, name, price_kes, rx_class, in_stock, featured, published, categories(name)", { count: "exact" })
    .order("name");
  if (q) query = query.or(`name.ilike.%${q.replace(/[%,()]/g, " ")}%,sku.ilike.%${q.replace(/[%,()]/g, " ")}%`);
  if (category) query = query.eq("category_id", Number(category));
  const { data: products, count } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const pageHref = (p: number) =>
    `/admin/products?${new URLSearchParams({ ...(q && { q }), ...(category && { category }), ...(p > 1 && { page: String(p) }) })}`;

  return (
    <>
      <AdminHeading title="Products">
        <Link
          href="/admin/products/new"
          className="inline-flex h-11 items-center rounded-full bg-brand px-5 font-bold text-white hover:bg-brand-dark"
        >
          Add a product
        </Link>
      </AdminHeading>
      {params.deleted && (
        <p role="status" className="mb-4 rounded-xl bg-mist p-3 font-bold text-brand">
          Product deleted.
        </p>
      )}

      <form role="search" className="mb-5 flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm font-bold">
          Name or code
          <input name="q" type="search" defaultValue={q} className={`${INPUT} w-64`} />
        </label>
        <label className="grid gap-1 text-sm font-bold">
          Category
          <select name="category" defaultValue={category} className={`${INPUT} w-56`}>
            <option value="">All categories</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="h-11 rounded-full border border-line bg-surface px-5 font-bold hover:border-brand">
          Filter
        </button>
      </form>

      <p className="mb-3 text-sm text-muted">
        {count ?? 0} {count === 1 ? "product" : "products"}. Change a price, stock or featured flag and press Save on that row: the shop updates straight away.
      </p>

      {products && products.length > 0 ? (
        <div className="rounded-2xl border border-line bg-surface">
          <div className="hidden grid-cols-[1fr_9rem_7rem_7rem_auto] gap-4 border-b border-line px-4 py-3 text-sm font-bold lg:grid" aria-hidden="true">
            <span>Product</span>
            <span>Price (KES)</span>
            <span>In stock</span>
            <span>Featured</span>
            <span className="w-36" />
          </div>
          <ul className="divide-y divide-line">
            {products.map((p) => (
              <li key={p.id}>
                <AdminForm
                  action={quickUpdateProduct.bind(null, p.id)}
                  aria-label={`Quick edit ${p.name}`}
                  className="grid gap-3 px-4 py-3 lg:grid-cols-[1fr_9rem_7rem_7rem_auto] lg:items-center lg:gap-4"
                >
                  <div className="min-w-0">
                    <Link href={`/admin/products/${p.id}`} className="font-bold text-brand underline">
                      {p.name}
                    </Link>
                    <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
                      <span>{p.sku}</span>
                      <span>{p.categories?.name}</span>
                      <RxBadge rxClass={p.rx_class} />
                      {!p.published && <span className="rounded bg-line px-1.5 text-xs font-bold">Hidden</span>}
                    </p>
                  </div>
                  <label className="text-sm font-bold lg:font-normal">
                    <span className="lg:sr-only">Price (KES)</span>
                    <input
                      name="price_kes"
                      inputMode="numeric"
                      defaultValue={p.price_kes}
                      className={`${INPUT} tabular-nums`}
                    />
                    <FieldError name="price_kes" id={`price-${p.id}-error`} />
                  </label>
                  <label className="flex min-h-11 items-center gap-2">
                    <input type="checkbox" name="in_stock" defaultChecked={p.in_stock} className="size-5 accent-brand" />
                    <span className="lg:sr-only">In stock</span>
                  </label>
                  <label className="flex min-h-11 items-center gap-2">
                    <input type="checkbox" name="featured" defaultChecked={p.featured} className="size-5 accent-brand" />
                    <span className="lg:sr-only">Featured on the home page</span>
                  </label>
                  <div className="w-36">
                    <SaveButton variant="secondary" size="sm">
                      Save
                    </SaveButton>
                  </div>
                </AdminForm>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <EmptyState>No products match. Clear the filter or add a product.</EmptyState>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-6 flex flex-wrap gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={pageHref(n)}
              aria-current={n === page ? "page" : undefined}
              className={`flex size-11 items-center justify-center rounded-full border font-bold ${
                n === page ? "border-brand bg-brand text-white" : "border-line bg-surface hover:border-brand"
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
