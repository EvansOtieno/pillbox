import type { ReactNode } from "react";
import { STATUS_LABEL, type OrderStatus } from "@/lib/domain/order-status";

/* Small presentational pieces shared by admin pages (server components). */

export function AdminHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
      {children}
    </div>
  );
}

const STATUS_STYLE: Record<OrderStatus, string> = {
  new: "bg-pmed-bg text-pmed",
  confirmed: "bg-mist text-brand",
  completed: "bg-line/60 text-muted",
  cancelled: "bg-rx-bg text-rx",
};

/** Status as text plus colour (never colour alone). */
export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold whitespace-nowrap ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Wide tables scroll sideways on small screens instead of breaking the layout. */
export function TableScroll({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div role="region" aria-label={label} tabIndex={0} className="overflow-x-auto rounded-2xl border border-line bg-surface">
      {children}
    </div>
  );
}

export const TH = "px-4 py-3 text-left text-sm font-bold whitespace-nowrap";
export const TD = "px-4 py-3 align-top";
export const INPUT =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-base focus-visible:border-brand aria-invalid:border-rx";
export const LABEL = "mb-1 block text-sm font-bold";

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-muted">{children}</p>;
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-KE", {
    timeZone: "Africa/Nairobi",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
