import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pages are prerendered from cached data ('use cache' + cacheTag) and refreshed when the admin
  // saves (revalidateTag). Anything request-specific streams inside <Suspense>.
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
