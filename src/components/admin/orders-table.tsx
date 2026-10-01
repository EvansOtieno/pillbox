import Link from "next/link";
import { formatMsisdnLocal } from "@/lib/domain/contact";
import { formatKes } from "@/lib/domain/money";
import type { OrderStatus } from "@/lib/domain/order-status";
import { StatusBadge, TableScroll, TD, TH, formatDateTime } from "./ui";

export interface OrderRow {
  id: string;
  number: number;
  created_at: string;
  customer_name: string;
  phone: string;
  fulfilment: "delivery" | "pickup";
  delivery_area: string;
  total_kes: number;
  status: OrderStatus;
}

export const ORDER_ROW_FIELDS =
  "id, number, created_at, customer_name, phone, fulfilment, delivery_area, total_kes, status" as const;

export function OrdersTable({ orders, label }: { orders: OrderRow[]; label: string }) {
  return (
    <TableScroll label={label}>
      <table className="w-full min-w-[44rem] border-collapse">
        <thead className="border-b border-line bg-paper">
          <tr>
            <th scope="col" className={TH}>Order</th>
            <th scope="col" className={TH}>Placed</th>
            <th scope="col" className={TH}>Customer</th>
            <th scope="col" className={TH}>Delivery</th>
            <th scope="col" className={`${TH} text-right`}>Total</th>
            <th scope="col" className={TH}>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-paper">
              <td className={TD}>
                <Link href={`/admin/orders/${o.id}`} className="font-bold text-brand underline">
                  #{o.number}
                </Link>
              </td>
              <td className={`${TD} whitespace-nowrap`}>{formatDateTime(o.created_at)}</td>
              <td className={TD}>
                <span className="block font-bold">{o.customer_name}</span>
                <span className="text-sm text-muted tabular-nums">{formatMsisdnLocal(o.phone)}</span>
              </td>
              <td className={TD}>{o.fulfilment === "pickup" ? "Pick-up" : o.delivery_area}</td>
              <td className={`${TD} text-right font-bold tabular-nums`}>{formatKes(o.total_kes)}</td>
              <td className={TD}>
                <StatusBadge status={o.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}
