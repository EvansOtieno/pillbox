import Link from "next/link";
import { Suspense } from "react";
import { CrossIcon, MenuIcon } from "@/components/icons";
import { NavLinks, type NavItem } from "@/components/admin/nav-links";
import { requireStaff } from "@/lib/admin/auth";
import { signOut } from "../auth-actions";

const STAFF_NAV: NavItem[] = [
  { href: "/admin", label: "Today" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/faqs", label: "FAQs" },
];
const OWNER_NAV: NavItem[] = [
  { href: "/admin/delivery", label: "Delivery areas" },
  { href: "/admin/settings", label: "Settings" },
];

// (panel) is a route group: every signed-in admin page shares this frame; /admin/login doesn't.
export default function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="bg-ink text-white lg:sticky lg:top-0 lg:h-dvh">
        <div className="flex items-center justify-between gap-3 px-4 py-4 lg:px-5 lg:py-6">
          <Link href="/admin" className="flex items-center gap-2 rounded-md">
            <CrossIcon className="size-6 text-cross" />
            <span className="font-extrabold tracking-tight">Afya Corner</span>
          </Link>
          <Link href="/" className="text-sm text-white/70 underline hover:text-white lg:hidden">
            View shop
          </Link>
        </div>
        {/* Signed-in details and navigation depend on the session, so they stream in. */}
        <Suspense fallback={<div className="h-40" />}>
          <StaffMenu />
        </Suspense>
      </aside>
      <main id="main" className="min-w-0 px-4 py-6 lg:px-10 lg:py-8">
        {children}
      </main>
    </div>
  );
}

async function StaffMenu() {
  const staff = await requireStaff();
  const items = staff.role === "owner" ? [...STAFF_NAV, ...OWNER_NAV] : STAFF_NAV;
  const account = (
    <div className="border-t border-white/15 px-3 pt-4 text-sm">
      <p className="font-bold">{staff.fullName || staff.email}</p>
      <p className="text-white/70">{staff.role === "owner" ? "Owner" : "Staff"}</p>
      <form action={signOut} className="mt-3">
        <button type="submit" className="min-h-11 rounded-lg px-0 font-bold text-white/85 underline hover:text-white">
          Sign out
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Phones: navigation folds into a menu under the top bar. */}
      <details className="border-t border-white/15 lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 font-bold [&::-webkit-details-marker]:hidden">
          <MenuIcon className="size-5" />
          Menu
        </summary>
        <nav aria-label="Admin" className="space-y-4 px-2 pb-4">
          <NavLinks items={items} />
          {account}
        </nav>
      </details>
      <nav aria-label="Admin" className="hidden h-[calc(100dvh-5rem)] flex-col justify-between px-2 pb-6 lg:flex">
        <NavLinks items={items} />
        <div>
          <Link href="/" className="mb-4 block px-3 text-sm text-white/70 underline hover:text-white">
            View the shop
          </Link>
          {account}
        </div>
      </nav>
    </>
  );
}
