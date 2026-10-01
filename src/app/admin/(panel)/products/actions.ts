"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { checked, failed, fromDbError, saved, slugify, text, whole, type ActionResult } from "@/lib/admin/action-result";
import { requireOwner, requireStaff } from "@/lib/admin/auth";
import { TAGS } from "@/lib/data/tags";
import type { RxClass } from "@/lib/domain/product-rules";

/*
 * Product saves. Each one expires the storefront caches that show products (updateTag = read your
 * own writes: the next page view waits for fresh data), then refreshes the admin page itself.
 */

function expireProduct(...slugs: Array<string | null | undefined>) {
  updateTag(TAGS.catalogue);
  for (const slug of slugs) if (slug) updateTag(TAGS.product(slug));
}

const RX_CLASSES: RxClass[] = ["general", "pharmacy_only", "prescription_only"];

/** Products list: price, stock and featured in one small form per row. */
export async function quickUpdateProduct(id: number, _prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const { supabase } = await requireStaff();
  const price = whole(form, "price_kes");
  if (price === null || price < 0) return failed("Enter the price in whole shillings.", { price_kes: "Whole shillings, e.g. 450" });

  const { data, error } = await supabase
    .from("products")
    .update({ price_kes: price, in_stock: checked(form, "in_stock"), featured: checked(form, "featured") })
    .eq("id", id)
    .select("slug")
    .single();
  if (error) return fromDbError(error);
  expireProduct(data.slug);
  refresh();
  return saved();
}

/** Full product form: create (id = null) or update. */
export async function saveProduct(id: number | null, _prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const { supabase } = await requireStaff();

  const name = text(form, "name");
  const slug = slugify(text(form, "slug") || name);
  const sku = text(form, "sku").toUpperCase();
  const price = whole(form, "price_kes");
  const categoryId = whole(form, "category_id");
  const rx = text(form, "rx_class") as RxClass;

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Enter the product name.";
  if (!slug) errors.slug = "Enter a web address, e.g. paracetamol-500mg-24s.";
  if (!sku) errors.sku = "Enter a product code.";
  if (price === null || price < 0) errors.price_kes = "Enter the price in whole shillings.";
  if (!categoryId) errors.category_id = "Choose a category.";
  if (!RX_CLASSES.includes(rx)) errors.rx_class = "Choose a medicine class.";
  if (Object.keys(errors).length) return failed("Check the highlighted fields.", errors);

  const values = {
    name,
    slug,
    sku,
    price_kes: price!,
    category_id: categoryId!,
    rx_class: rx,
    short_description: text(form, "short_description"),
    description: text(form, "description"),
    in_stock: checked(form, "in_stock"),
    featured: checked(form, "featured"),
    published: checked(form, "published"),
  };

  if (id === null) {
    const { data, error } = await supabase.from("products").insert(values).select("id").single();
    if (error) return fromDbError(error);
    expireProduct(slug);
    redirect(`/admin/products/${data.id}?created=1`);
  }

  const { data: before } = await supabase.from("products").select("slug").eq("id", id).single();
  const { error } = await supabase.from("products").update(values).eq("id", id);
  if (error) return fromDbError(error);
  expireProduct(slug, before?.slug); // a renamed slug expires the old page too
  refresh();
  return saved();
}

/** Owner only (RLS agrees). Products that were ordered keep their order history: order_items snapshot them. */
export async function deleteProduct(id: number, _prev: ActionResult | null, _form: FormData): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const { data, error } = await supabase.from("products").delete().eq("id", id).select("slug").single();
  if (error) return fromDbError(error);
  expireProduct(data.slug);
  redirect("/admin/products?deleted=1");
}

/**
 * After the browser uploaded a photo to Storage: point the product at it and remove the old file.
 * The path must be inside this product's folder, so a crafted request can't attach someone else's file.
 */
export async function setProductImage(id: number, path: string | null): Promise<ActionResult> {
  const { supabase } = await requireStaff();
  if (path !== null && !path.startsWith(`products/${id}/`)) return failed("That image doesn't belong to this product.");

  const { data: before } = await supabase.from("products").select("image_path, slug").eq("id", id).single();
  const { error } = await supabase.from("products").update({ image_path: path }).eq("id", id);
  if (error) return fromDbError(error);
  if (before?.image_path && before.image_path !== path) {
    await supabase.storage.from("product-images").remove([before.image_path]);
  }
  expireProduct(before?.slug);
  refresh();
  return saved(path ? "Photo saved" : "Photo removed");
}
