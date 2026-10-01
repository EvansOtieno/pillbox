"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
}

/** Admin navigation with the current section marked (aria-current, not colour alone). */
export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const isCurrent = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const current = isCurrent(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-lg px-3 font-bold transition-colors ${
                current ? "bg-white text-ink" : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              {current && <span aria-hidden="true" className="mr-2 size-1.5 rounded-full bg-cross" />}
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
