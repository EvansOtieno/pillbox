import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ORDER_ROW_FIELDS, OrdersTable, type OrderRow } from "@/components/admin/orders-table";
import { AdminHeading, EmptyState } from "@/components/admin/ui";
import { requireStaff } from "@/lib/admin/auth";
import { formatKes } from "@/lib/domain/money";
import { startOfNairobiDay } from "@/lib/domain/order-status";

export const metadata: Metadata = { title: "Today" };

export default async function TodayPage({ searchParams }: PageProps<"/admin">) {
  const { supabase, fullName, role } = await requireStaff();
  await connection(); // "today" depends on the current time
  const since = startOfNairobiDay(new Date());

  const [{ data: today }, { count: waiting }] = await Promise.all([
    supabase.from("orders").select(ORDER_ROW_FIELDS).gte("created_at", since).order("created_at", { ascending: false }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);
  const orders = (today ?? []) as OrderRow[];
  const takings = orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.total_kes, 0);
  const ownerOnly = (await searchParams).error === "owner-only";

  return (
    <>
      <AdminHeading title={`Good to see you${fullName ? `, ${fullName.split(" ")[0]}` : ""}`} />
      {ownerOnly && role !== "owner" && (
        <p role="alert" className="mb-6 rounded-xl border border-pmed/30 bg-pmed-bg p-3 font-bold text-pmed">
          That page is for the owner only.
        </p>
      )}

      <dl className="mb-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <dt className="text-sm font-bold text-muted">Waiting for confirmation</dt>
          <dd className="mt-1 text-3xl font-extrabold tabular-nums">
            <Link href="/admin/orders?status=new" className="hover:text-brand hover:underline">
              {waiting ?? 0}
            </Link>
          </dd>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <dt className="text-sm font-bold text-muted">Orders today</dt>
          <dd className="mt-1 text-3xl font-extrabold tabular-nums">{orders.length}</dd>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <dt className="text-sm font-bold text-muted">Value today (not cancelled)</dt>
          <dd className="mt-1 text-3xl font-extrabold tabular-nums">{formatKes(takings)}</dd>
        </div>
      </dl>

      <h2 className="mb-3 text-lg font-extrabold">Today&apos;s orders</h2>
      {orders.length > 0 ? (
        <OrdersTable orders={orders} label="Today's orders" />
      ) : (
        <EmptyState>
          No orders yet today. New orders appear here as soon as customers check out.{" "}
          <Link href="/admin/orders" className="font-bold text-brand underline">
            See all orders
          </Link>
        </EmptyState>
      )}
    </>
  );
}
