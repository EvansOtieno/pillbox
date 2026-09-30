import Link from "next/link";
import { getSettings } from "@/lib/data/storefront";
import { hoursFrom } from "@/lib/site";
import { MenuIcon, SearchIcon } from "./icons";
import { OpenBadge, StoreCross } from "./open-status";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/delivery", label: "Delivery" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export function SearchForm({ placeholder, defaultValue = "", id }: { placeholder: string; defaultValue?: string; id: string }) {
  return (
    <form action="/search" role="search" className="relative w-full">
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted" />
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete="off"
        className="h-11 w-full rounded-full border border-line bg-surface pr-24 pl-11 text-base placeholder:text-muted/80 focus-visible:border-cross"
      />
      <button
        type="submit"
        className="absolute top-1 right-1 h-9 rounded-full bg-brand px-4 text-sm font-bold text-white transition hover:bg-brand-dark active:scale-95"
      >
        Search
      </button>
    </form>
  );
}

export async function SiteHeader() {
  const settings = await getSettings();
  const hours = hoursFrom(settings);

  return (
    <header className="border-b border-line bg-surface/95">
      <div className="mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-3 px-4 py-3 md:grid-cols-[auto_minmax(0,28rem)_1fr]">
        <Link href="/" className="group flex items-center gap-2 rounded-md" aria-label={`${settings.store_name} home`}>
          <StoreCross hours={hours} className="size-8 transition-transform group-hover:scale-105" />
          <span className="text-xl leading-none font-extrabold tracking-tight">{settings.store_name}</span>
        </Link>

        {/* Steps aside on the home page, which has its own big search (see globals.css). */}
        <div data-header-search className="col-span-3 row-start-2 md:col-span-1 md:col-start-2 md:row-start-1">
          <SearchForm id="header-search" placeholder={settings.search_placeholder} />
        </div>

        <div className="col-start-3 row-start-1 flex items-center justify-end gap-5">
          <OpenBadge hours={hours} className="hidden text-sm whitespace-nowrap text-muted xl:inline-flex" />
          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex gap-5 text-[0.95rem] font-bold">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="rounded-sm decoration-cross decoration-2 underline-offset-8 hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {/* Mobile menu without JavaScript: <details> opens and closes natively. */}
          <details className="relative md:hidden">
            <summary className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full border border-line [&::-webkit-details-marker]:hidden">
              <MenuIcon className="size-5" />
              <span className="sr-only">Menu</span>
            </summary>
            <nav aria-label="Main" className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-line bg-surface p-2 shadow-lift">
              <OpenBadge hours={hours} className="flex px-3 py-2 text-sm text-muted" />
              <ul>
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="block rounded-lg px-3 py-2.5 font-bold hover:bg-mist">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
