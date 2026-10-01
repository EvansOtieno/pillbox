"use server";

import { refresh, updateTag } from "next/cache";
import { failed, fromDbError, saved, type ActionResult } from "@/lib/admin/action-result";
import { requireOwner } from "@/lib/admin/auth";
import { TAGS } from "@/lib/data/tags";
import { SETTING_FIELDS, readField, type SettingsTab } from "@/lib/settings/fields";
import { settingsFields, type SettingKey } from "@/lib/settings/schema";
import type { Json } from "@/lib/supabase/database.types";

/**
 * Save one settings tab. Each value goes through its zod schema (the same one the storefront reads
 * with); other tabs are untouched. Owner only (RLS agrees).
 */
export async function saveSettings(tab: SettingsTab, _prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const fields = SETTING_FIELDS.filter((f) => f.tab === tab);

  const errors: Record<string, string> = {};
  const rows: Array<{ key: SettingKey; value: NonNullable<Json> }> = [];
  for (const field of fields) {
    const parsed = settingsFields[field.key].safeParse(readField(field, form));
    if (parsed.success) rows.push({ key: field.key, value: parsed.data as NonNullable<Json> });
    else errors[field.key] = parsed.error.issues[0]?.message ?? "Check this value.";
  }

  if (tab === "contact") {
    const open = rows.find((r) => r.key === "open_time")?.value;
    const close = rows.find((r) => r.key === "close_time")?.value;
    if (typeof open === "string" && typeof close === "string" && open >= close) {
      errors.close_time = "Closing time must be after opening time.";
    }
  }
  if (Object.keys(errors).length) return failed("Nothing was saved. Check the highlighted fields.", errors);

  const { error } = await supabase.from("settings").upsert(rows);
  if (error) return fromDbError(error);
  updateTag(TAGS.settings);
  refresh();
  return saved();
}
