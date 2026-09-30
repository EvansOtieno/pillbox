import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * Anonymous client for the storefront: reads the public catalogue and calls place_order().
 * No cookies and no session, so it is safe inside cached ('use cache') functions: every visitor
 * gets the same data, and RLS treats the caller as `anon`.
 */
export function createPublicClient() {
  const { url, publishableKey } = supabaseEnv();
  return createClient<Database>(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
