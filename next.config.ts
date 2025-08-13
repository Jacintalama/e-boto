import type { NextConfig } from "next";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:4000";

// Optional: fail fast if you want to enforce setting it
// if (!process.env.NEXT_PUBLIC_API_BASE) {
//   console.warn("[next.config] NEXT_PUBLIC_API_BASE not set. Using default:", API);
// }

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Proxy API + Auth through the Next host so cookies are included
      { source: "/api/:path*",  destination: `${API}/api/:path*` },
      { source: "/auth/:path*", destination: `${API}/auth/:path*` },

      // Serve uploaded files via same origin (so <img src="/uploads/..."> works)
      { source: "/uploads/:path*", destination: `${API}/uploads/:path*` },
    ];
  },

  // (Optional) If you load remote images directly (not via /uploads rewrite), allow them:
  // images: {
  //   remotePatterns: [
  //     { protocol: "http", hostname: "127.0.0.1", port: "4000", pathname: "/uploads/**" },
  //     { protocol: "http", hostname: "localhost", port: "4000", pathname: "/uploads/**" },
  //     { protocol: "http", hostname: "192.168.1.236", port: "4000", pathname: "/uploads/**" },
  //   ],
  // },
};

export default nextConfig;
