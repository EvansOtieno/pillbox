import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/*
 * Permission checks for the admin, like @PreAuthorize on a service method. Call one at the top of
 * every admin page and every admin Server Action (a Server Action is its own HTTP endpoint, so the
 * page's check doesn't cover it). RLS in Postgres enforces the same rules again underneath.
 */

export type StaffRole = "owner" | "staff";

export interface StaffSession {
  supabase: Awaited<ReturnType<typeof createServerSupabase>>;
  userId: string;
  email: string;
  fullName: string;
  role: StaffRole;
}

async function currentStaff(): Promise<StaffSession | null> {
  // Per-request by nature (session cookie, token expiry checks against the clock): never prerender it.
  await connection();
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", userId).maybeSingle();
  if (!profile) return null;
  return {
    supabase,
    userId,
    email: String(data.claims.email ?? ""),
    fullName: profile.full_name,
    role: profile.role,
  };
}

/** Owner or staff; otherwise off to the login page (signed out) or the no-access page (signed in, not staff). */
export async function requireStaff(): Promise<StaffSession> {
  const staff = await currentStaff();
  if (staff) return staff;
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getClaims();
  redirect(data?.claims?.sub ? "/admin/login?error=no-access" : "/admin/login");
}

/** Owner only (settings, delivery areas, deleting products). */
export async function requireOwner(): Promise<StaffSession> {
  const staff = await requireStaff();
  if (staff.role !== "owner") redirect("/admin?error=owner-only");
  return staff;
}
