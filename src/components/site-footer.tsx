import Link from "next/link";
import { getDeliveryAreas, getSettings } from "@/lib/data/storefront";
import { deliverySummary } from "@/lib/domain/delivery";
import { hoursLine } from "@/lib/domain/hours";
import { hoursFrom } from "@/lib/site";

const LINKS = [
  { href: "/about", label: "About us" },
  { href: "/delivery", label: "Delivery and pick-up" },
  { href: "/faq", label: "Questions and answers" },
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms of service" },
  { href: "/privacy", label: "Privacy policy" },
] as const;

export async function SiteFooter() {
  const [settings, areas] = await Promise.all([getSettings(), getDeliveryAreas()]);

  return (
    <footer className="mt-20 border-t border-line bg-surface pb-28 md:pb-10">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
        <div className="max-w-sm">
          <p className="text-lg font-extrabold tracking-tight">{settings.store_name}</p>
          <p className="mt-2 text-muted">{settings.store_address}</p>
          <p className="mt-1 text-muted">{hoursLine(hoursFrom(settings))}</p>
          <p className="mt-4 text-sm text-muted">{deliverySummary(areas)}</p>
        </div>
        <nav aria-label="Footer">
          <ul className="space-y-2">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-brand hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-sm leading-relaxed text-muted sm:col-span-2 lg:col-span-1">
          Afya Corner is a fictional pharmacy. This site is a portfolio project built with Next.js and Supabase:
          products, prices and contact details are demo data, and nothing is sold.
        </p>
      </div>
    </footer>
  );
}
