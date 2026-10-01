import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/*
 * Runs before every /admin request, like a Servlet filter. Two jobs:
 *  1. Refresh the Supabase session cookie when the access token is about to expire.
 *  2. An optimistic check: no valid session → send to /admin/login.
 * The real permission checks happen in the pages and Server Actions (requireStaff/requireOwner)
 * and, underneath everything, in Postgres RLS.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet, headers) => {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
          for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
        },
      },
    },
  );

  // getClaims() verifies the JWT (and refreshes it if needed); never trust the cookie without it.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const isLogin = request.nextUrl.pathname === "/admin/login";

  if (!signedIn && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    // Come back to exactly this page after signing in, filters included.
    const back = request.nextUrl.pathname + request.nextUrl.search;
    url.search = back === "/admin" ? "" : `?next=${encodeURIComponent(back)}`;
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
