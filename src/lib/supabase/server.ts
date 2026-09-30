import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * Client for the admin (Server Components, Server Actions, route handlers). It reads the signed-in
 * staff member's session from cookies, so RLS sees them as `authenticated` with their own auth.uid().
 * Never use it inside 'use cache': the result depends on who is asking.
 */
export async function createServerSupabase() {
  const { url, publishableKey } = supabaseEnv();
  const cookieStore = await cookies();
  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component, where cookies are read-only. Safe to ignore:
          // src/proxy.ts refreshes the session cookie on every admin request (Milestone 4).
        }
      },
    },
  });
}
