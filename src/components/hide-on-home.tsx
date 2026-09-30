"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** The home page has its own big search box, so the header's copy steps aside there. */
export function HideOnHome({ children, className }: { children: ReactNode; className?: string }) {
  const pathname = usePathname();
  return <div className={`${className ?? ""} ${pathname === "/" ? "md:invisible max-md:hidden" : ""}`}>{children}</div>;
}
