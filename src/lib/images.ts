/** Public URL of a file in the product-images bucket (public bucket: no key needed to read). */
export function productImageUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  return `${base}/storage/v1/object/public/product-images/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
