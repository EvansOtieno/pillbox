"use server";

import { refresh, updateTag } from "next/cache";
import { checked, failed, fromDbError, saved, slugify, text, whole, type ActionResult } from "@/lib/admin/action-result";
import { requireOwner, requireStaff } from "@/lib/admin/auth";
import { TAGS } from "@/lib/data/tags";

/*
 * Categories and FAQs (staff), delivery areas (owner). Each save expires the storefront tag that
 * shows that data. Deleting relies on the database: a category with products can't be removed (FK).
 */

type Result = Promise<ActionResult>;

function done(tag: string, message?: string): ActionResult {
  updateTag(tag);
  refresh();
  return saved(message);
}

/** Delete one row and report "not allowed" when RLS silently matched nothing. */
async function deleteRow(
  supabase: Awaited<ReturnType<typeof requireStaff>>["supabase"],
  table: "categories" | "faqs" | "delivery_areas",
  id: number,
): Promise<ActionResult | null> {
  const { data, error } = await supabase.from(table).delete().eq("id", id).select("id");
  if (error) return fromDbError(error);
  if (!data?.length) return failed("Your account isn't allowed to delete this. Ask the owner.");
  return null;
}

/* ---------------------------------------------------------------- categories */

export async function saveCategory(id: number | null, _prev: ActionResult | null, form: FormData): Result {
  const { supabase } = await requireStaff();
  const name = text(form, "name");
  const slug = slugify(text(form, "slug") || name);
  if (name.length < 2) return failed("Enter the category name.", { name: "Enter the category name." });
  const values = { name, slug, description: text(form, "description"), sort_order: whole(form, "sort_order") ?? 0 };
  const { error } = id === null ? await supabase.from("categories").insert(values) : await supabase.from("categories").update(values).eq("id", id);
  if (error) return fromDbError(error);
  return done(TAGS.catalogue, id === null ? "Category added" : "Saved");
}

export async function deleteCategory(id: number, _prev: ActionResult | null, _form: FormData): Result {
  const { supabase } = await requireOwner();
  return (await deleteRow(supabase, "categories", id)) ?? done(TAGS.catalogue, "Deleted");
}

/* ---------------------------------------------------------------- FAQs */

export async function saveFaq(id: number | null, _prev: ActionResult | null, form: FormData): Result {
  const { supabase } = await requireStaff();
  const question = text(form, "question");
  const answer = text(form, "answer");
  const errors: Record<string, string> = {};
  if (!question) errors.question = "Enter the question.";
  if (!answer) errors.answer = "Enter the answer.";
  if (Object.keys(errors).length) return failed("Check the highlighted fields.", errors);
  const values = { question, answer, sort_order: whole(form, "sort_order") ?? 0 };
  const { error } = id === null ? await supabase.from("faqs").insert(values) : await supabase.from("faqs").update(values).eq("id", id);
  if (error) return fromDbError(error);
  return done(TAGS.faqs, id === null ? "Question added" : "Saved");
}

export async function deleteFaq(id: number, _prev: ActionResult | null, _form: FormData): Result {
  const { supabase } = await requireStaff();
  return (await deleteRow(supabase, "faqs", id)) ?? done(TAGS.faqs, "Deleted");
}

/* ---------------------------------------------------------------- delivery areas (owner) */

export async function saveArea(id: number | null, _prev: ActionResult | null, form: FormData): Result {
  const { supabase } = await requireOwner();
  const name = text(form, "name");
  const fee = whole(form, "fee_kes");
  const errors: Record<string, string> = {};
  if (!name) errors.name = "Enter the area name.";
  if (fee === null || fee < 0) errors.fee_kes = "Whole shillings, 0 or more.";
  if (Object.keys(errors).length) return failed("Check the highlighted fields.", errors);
  const values = {
    name,
    fee_kes: fee!,
    is_pickup: checked(form, "is_pickup"),
    active: checked(form, "active"),
    sort_order: whole(form, "sort_order") ?? 0,
  };
  const { error } =
    id === null ? await supabase.from("delivery_areas").insert(values) : await supabase.from("delivery_areas").update(values).eq("id", id);
  if (error) return fromDbError(error);
  return done(TAGS.delivery, id === null ? "Area added" : "Saved");
}

export async function deleteArea(id: number, _prev: ActionResult | null, _form: FormData): Result {
  const { supabase } = await requireOwner();
  return (await deleteRow(supabase, "delivery_areas", id)) ?? done(TAGS.delivery, "Deleted");
}
