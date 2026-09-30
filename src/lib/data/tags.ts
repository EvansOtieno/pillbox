/**
 * Cache tags for storefront data. Cached reads declare them with cacheTag(); admin saves (Milestone 4)
 * call revalidateTag()/updateTag() with the same names, like @CacheEvict on a named cache.
 */
export const TAGS = {
  settings: "settings",
  catalogue: "catalogue",
  product: (slug: string) => `product:${slug}`,
  delivery: "delivery",
  faqs: "faqs",
} as const;
