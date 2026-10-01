import type { Metadata } from "next";
import Link from "next/link";
import { ORDER_ROW_FIELDS, OrdersTable, type OrderRow } from "@/components/admin/orders-table";
import { AdminHeading, EmptyState } from "@/components/admin/ui";
import { requireStaff } from "@/lib/admin/auth";
import { STATUS_LABEL, type OrderStatus } from "@/lib/domain/order-status";

export const metadata: Metadata = { title: "Orders" };

const FILTERS: Array<{ value: OrderStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  ...(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] })),
];
const PAGE_SIZE = 50;

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const { supabase } = await requireStaff();
  const params = await searchParams;
  const status = FILTERS.some((f) => f.value === params.status) ? (params.status as OrderStatus) : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  let query = supabase.from("orders").select(ORDER_ROW_FIELDS, { count: "exact" }).order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, count } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const orders = (data ?? []) as OrderRow[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const href = (s: string, p = 1) => `/admin/orders?${new URLSearchParams({ ...(s !== "all" && { status: s }), ...(p > 1 && { page: String(p) }) })}`;

  return (
    <>
      <AdminHeading title="Orders" />
      <nav aria-label="Filter by status" className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const current = (status ?? "all") === f.value;
          return (
            <Link
              key={f.value}
              href={href(f.value)}
              aria-current={current ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-bold ${
                current ? "border-brand bg-brand text-white" : "border-line bg-surface hover:border-brand"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>
      {orders.length > 0 ? (
        <OrdersTable orders={orders} label="Orders" />
      ) : (
        <EmptyState>No {status ? STATUS_LABEL[status].toLowerCase() : ""} orders.</EmptyState>
      )}
      {pages > 1 && (
        <nav aria-label="Pages" className="mt-6 flex gap-2">
          {page > 1 && (
            <Link href={href(status ?? "all", page - 1)} className="font-bold text-brand underline">
              Newer
            </Link>
          )}
          <span className="text-muted">
            Page {page} of {pages}
          </span>
          {page < pages && (
            <Link href={href(status ?? "all", page + 1)} className="font-bold text-brand underline">
              Older
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
