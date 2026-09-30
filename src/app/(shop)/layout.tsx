import { ContactDock } from "@/components/contact-dock";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

// (shop) is a route group: it shares this layout without adding "/shop" to the URLs.
export default function ShopLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-brand px-4 py-2 font-bold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <ContactDock />
    </>
  );
}
