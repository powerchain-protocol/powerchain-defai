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
  transpilePackages: ["@powerchain/backend", "@powerchain/database", "@powerchain/runtime"],
  serverExternalPackages: ["@prisma/adapter-pg", "@prisma/client", "pg"],
  experimental: { optimizePackageImports: ["@mysten/sui", "@solana/web3.js"] },
  async headers() { return [{ source: "/:path*", headers: securityHeaders }]; },
};
export default config;
