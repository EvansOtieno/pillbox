import { formatKes } from "@/lib/domain/money";
import { productAction, showPrice, type RxClass } from "@/lib/domain/product-rules";
import { whatsappUrl } from "@/lib/domain/contact";
import { fillTemplate } from "@/lib/domain/template";
import Image from "next/image";
import type { CartProduct } from "@/lib/cart/cart-logic";
import { productImageUrl } from "@/lib/images";
import type { Settings } from "@/lib/settings/schema";
import { SITE_URL } from "@/lib/site";
import { CategoryIcon, WhatsAppIcon } from "./icons";

/* Small pieces shared by product cards and the product page. */

export function RxBadge({ rxClass }: { rxClass: RxClass }) {
  if (rxClass === "pharmacy_only") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-md bg-pmed-bg px-2 py-0.5 text-xs font-bold text-pmed"
        title="A pharmacist confirms this medicine before dispatch"
      >
        <span aria-hidden="true">P</span> Pharmacy-only
      </span>
    );
  }
  if (rxClass === "prescription_only") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-md bg-rx-bg px-2 py-0.5 text-xs font-bold text-rx"
        title="Needs a prescription: not sold online"
      >
        <span aria-hidden="true">℞</span> Prescription
      </span>
    );
  }
  return null;
}

export function StockNote({ inStock }: { inStock: boolean }) {
  return inStock ? null : <span className="text-xs font-bold text-muted">Out of stock</span>;
}

export function Price({
  product,
  settings,
  className = "",
}: {
  product: { price_kes: number; rx_class: RxClass; in_stock: boolean };
  settings: Settings;
  className?: string;
}) {
  return showPrice(product, settings.hide_rx_price) ? (
    <span className={`font-extrabold tabular-nums ${className}`}>{formatKes(product.price_kes)}</span>
  ) : (
    <span className={`text-sm font-bold text-muted ${className}`}>{settings.rx_price_label}</span>
  );
}

/**
 * Product photo from Storage, resized by next/image. Without a photo: the category mark on a tinted
 * tile. The tile keeps its aspect ratio either way, so nothing shifts while images load.
 */
export function ProductImage({
  categorySlug,
  imagePath,
  alt,
  sizes,
  className = "",
}: {
  categorySlug: string;
  imagePath?: string | null;
  alt?: string;
  sizes?: string;
  className?: string;
}) {
  if (imagePath) {
    return (
      <div className={`relative overflow-hidden bg-mist ${className}`}>
        <Image src={productImageUrl(imagePath)} alt={alt ?? ""} fill sizes={sizes ?? "(min-width: 1024px) 25vw, 50vw"} className="object-contain p-2" />
      </div>
    );
  }
  return (
    <div className={`flex items-center justify-center bg-mist text-brand/70 ${className}`}>
      <CategoryIcon slug={categorySlug} className="h-2/5 w-auto" strokeWidth={1.2} />
    </div>
  );
}

/** WhatsApp link for "Consult pharmacist" / "Ask a pharmacist", or null when the product can be bought. */
export function consultLink(product: { name: string; slug: string; rx_class: RxClass; in_stock: boolean }, settings: Settings) {
  const action = productAction(product);
  if (action.kind === "add_to_cart") return null;
  const text = fillTemplate(settings[action.messageKey], {
    store: settings.store_name,
    product: product.name,
    url: `${SITE_URL}/product/${product.slug}`,
  });
  return { label: action.label, href: whatsappUrl(settings.whatsapp_number, text) };
}

export function ConsultButton({ href, label, size = "md" }: { href: string; label: string; size?: "md" | "lg" }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className={`inline-flex items-center justify-center gap-2 rounded-full border-2 border-brand font-bold text-brand transition hover:bg-brand hover:text-white active:scale-95 ${
        size === "lg" ? "h-12 px-6" : "h-11 px-4 text-sm"
      }`}
    >
      <WhatsAppIcon className="size-4.5" />
      {label}
    </a>
  );
}

/** What the cart needs to know about a product (serialisable, passed to the client button). */
export function cartProduct(
  product: { id: number; slug: string; name: string; price_kes: number; rx_class: RxClass },
  categorySlug: string,
): CartProduct {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    priceKes: product.price_kes,
    rxClass: product.rx_class,
    categorySlug,
  };
}
