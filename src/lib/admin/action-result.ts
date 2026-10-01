/*
 * What every admin Server Action returns to its form: success with a short message, or failure with
 * a message and optional per-field errors. `at` changes on every result, so the form can tell two
 * identical "Saved" results apart (and replay its confirmation).
 */

export type ActionResult =
  | { ok: true; message: string; at: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string>; at: number };

export const saved = (message = "Saved"): ActionResult => ({ ok: true, message, at: Date.now() });

export const failed = (message: string, fieldErrors?: Record<string, string>): ActionResult => ({
  ok: false,
  message,
  fieldErrors,
  at: Date.now(),
});

/** Turn a Postgres/PostgREST error into a sentence staff can act on. */
export function fromDbError(error: { code?: string; message: string; details?: string | null }): ActionResult {
  switch (error.code) {
    case "23505":
      return failed("That name, slug or code is already used by another record.");
    case "23503":
      return failed("It is still in use (for example, a category that has products), so it can't be removed.");
    case "23514":
      return failed("One of the values is not allowed. Check prices are whole shillings and not negative.");
    case "42501":
      return failed("Your account isn't allowed to make this change. Ask the owner.");
    case "P0001":
      return failed(error.details || error.message);
    default:
      console.error("admin action failed", error);
      return failed("The change couldn't be saved. Please try again.");
  }
}

/* ---------------------------------------------------------------- FormData readers */

export const text = (form: FormData, name: string) => String(form.get(name) ?? "").trim();
export const checked = (form: FormData, name: string) => form.get(name) === "on" || form.get(name) === "true";

/** Whole number or null when empty/invalid. */
export function whole(form: FormData, name: string): number | null {
  const raw = text(form, name).replace(/[,\s]/g, "");
  if (!/^-?\d+$/.test(raw)) return null;
  return Number(raw);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
