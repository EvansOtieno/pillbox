import { sortDeliveryOptions, type DeliveryOption } from "@/lib/domain/delivery";
import { dayRanges, formatTime } from "@/lib/domain/hours";
import { formatFee } from "@/lib/domain/money";
import type { OpeningHours } from "@/lib/domain/contact";
import { paragraphs } from "@/lib/site";
import { OpenBadge } from "./open-status";

/* Data-driven sections shared by several pages (same idea as the WordPress build's shortcodes). */

export function PageHeading({ title, intro }: { title: string; intro?: string }) {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{title}</h1>
      {intro && <p className="mt-3 text-lg text-muted">{intro}</p>}
    </div>
  );
}

/** Settings text as paragraphs; renders nothing when empty. */
export function Prose({ text, className = "" }: { text: string; className?: string }) {
  const paras = paragraphs(text);
  if (paras.length === 0) return null;
  return (
    <div className={`max-w-[68ch] space-y-4 text-[1.0625rem] leading-relaxed ${className}`}>
      {paras.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

/** Live delivery fees: pick-up first, then cheapest to dearest. */
export function DeliveryFeeTable({ areas }: { areas: DeliveryOption[] }) {
  const sorted = sortDeliveryOptions(areas);
  if (sorted.length === 0) return null;
  return (
    <table className="w-full max-w-md border-collapse text-left">
      <thead>
        <tr className="border-b-2 border-ink/80">
          <th scope="col" className="py-2 pr-4 font-bold">
            Area
          </th>
          <th scope="col" className="py-2 text-right font-bold">
            Delivery fee
          </th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((area) => (
          <tr key={area.id} className="border-b border-line">
            <th scope="row" className={`py-2 pr-4 font-normal ${area.is_pickup ? "font-bold text-brand" : ""}`}>
              {area.name}
            </th>
            <td className={`py-2 text-right tabular-nums ${area.is_pickup ? "font-bold text-brand" : ""}`}>
              {formatFee(area.fee_kes)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Opening hours with the live open/closed badge. */
export function HoursBlock({ hours }: { hours: OpeningHours }) {
  return (
    <div>
      <p className="text-lg">
        <span className="font-bold">{dayRanges(hours.days)}</span>{" "}
        <span className="tabular-nums">
          {formatTime(hours.open)} – {formatTime(hours.close)}
        </span>
      </p>
      <OpenBadge hours={hours} className="mt-1 inline-flex text-muted" />
    </div>
  );
}
