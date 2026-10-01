"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export type SignInState = { error?: string; email?: string };

/** Only redirect back into the admin (never to another site via ?next=): an /admin path plus query. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = String(value ?? "");
  return /^\/admin(\/[\w\-/]*)?(\?[\w=&%+.\-]*)?$/.test(next) ? next : "/admin";
}

export async function signIn(_prev: SignInState, form: FormData): Promise<SignInState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email address and password.", email };

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Same message whether the email or the password is wrong: don't reveal which accounts exist.
    return { error: "That email and password don't match a staff account.", email };
  }
  redirect(safeNext(form.get("next")));
}

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/admin/login?signed-out=1");
}
