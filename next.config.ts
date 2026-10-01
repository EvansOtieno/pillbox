import type { NextConfig } from "next";

// Product photos are served by Supabase Storage; next/image resizes them for each screen.
const supabase = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321");
const supabaseIsLocal = ["127.0.0.1", "localhost", "[::1]"].includes(supabase.hostname);

const nextConfig: NextConfig = {
  // Pages are prerendered from cached data ('use cache' + cacheTag) and refreshed when the admin
  // saves (updateTag). Anything request-specific streams inside <Suspense>.
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [
      {
        protocol: supabase.protocol.replace(":", "") as "http" | "https",
        hostname: supabase.hostname,
        port: supabase.port,
        pathname: "/storage/v1/object/public/product-images/**",
      },
    ],
    // Next 16 refuses to optimise images from private IPs; allow it only for the local Supabase stack.
    dangerouslyAllowLocalIP: supabaseIsLocal,
  },
};

export default nextConfig;
