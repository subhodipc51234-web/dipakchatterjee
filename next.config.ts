import type { NextConfig } from "next";

// Static security headers (the CSP itself is set in proxy.ts, since it
// needs a fresh per-request nonce — see that file for why).
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig = {
  // Framework fingerprinting: Next.js sends an `X-Powered-By: Next.js`
  // response header by default — no reason to advertise the stack.
  poweredByHeader: false,
  reactStrictMode: true,
  // Explicit, not just relying on the (also false) default: never ship
  // browser source maps from a production build.
  productionBrowserSourceMaps: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utkwwtdkhqvdshbjwikm.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Default is 1MB; the complaint form submits photos/videos as
      // FormData through a Server Action.
      bodySizeLimit: "30mb",
    },
  },
} satisfies NextConfig;

export default nextConfig;
