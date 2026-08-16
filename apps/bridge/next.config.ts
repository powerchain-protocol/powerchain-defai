import path from "node:path";
import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
];

const config: NextConfig = {
  distDir: ".next",
  output: "standalone",
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  typedRoutes: true,
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  productionBrowserSourceMaps: false,
  transpilePackages: ["@powerchain/backend", "@powerchain/database", "@powerchain/runtime", "@powerchain/protocol", "@powerchain/blockchain", "@powerchain/clusters", "@powerchain/chat", "@powerchain/staking", "@powerchain/bridge-core", "@powerchain/swap-core"],
  serverExternalPackages: ["@prisma/adapter-pg", "@prisma/client", "pg"],
  experimental: { optimizePackageImports: ["@mysten/sui", "@solana/web3.js", "@wormhole-foundation/wormhole-connect"] },
  images: { formats: ["image/avif", "image/webp"] },
  async headers() { return [{ source: "/:path*", headers: securityHeaders }]; },
  async redirects() {
    return [
      { source: "/", destination: "/chat", permanent: false },
      { source: "/home", destination: "/chat", permanent: true },
      { source: "/app", destination: "/chat", permanent: true },
      { source: "/defai", destination: "/chat", permanent: true },
      { source: "/assistant", destination: "/chat", permanent: true },
      { source: "/stake", destination: "/staking", permanent: true },
      { source: "/trade", destination: "/swap", permanent: true },
      { source: "/transactions", destination: "/history", permanent: true },
      { source: "/api/bridge", destination: "/api/v1/bridge/openapi", permanent: false },
      { source: "/api/swap", destination: "/api/v1/swap/openapi", permanent: false },
      { source: "/api", destination: "/api/v1/openapi", permanent: false },
      { source: "/api/openapi", destination: "/api/v1/openapi", permanent: true },
      { source: "/openapi", destination: "/api/v1/openapi", permanent: true },
      { source: "/swagger", destination: "/api/v1/openapi", permanent: true },
    ];
  },
};
export default config;
