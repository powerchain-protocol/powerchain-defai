import fs from "node:fs";
const required = [
  "apps/bridge/components/legal/cookies.tsx",
  "apps/bridge/components/legal/cookie-preferences-button.tsx",
  "apps/bridge/hooks/use-cookies.ts",
  "apps/bridge/hooks/use-toast.ts",
  "apps/bridge/lib/notices.ts",
  "apps/bridge/components/errors/error-boundary.tsx",
  "apps/backend/src/services/ip-security.ts",
  "docs/PRODUCT_SAFETY_LEGAL.md",
  "apps/bridge/app/legal/privacy/page.tsx",
  "apps/bridge/app/legal/terms/page.tsx",
  "apps/bridge/app/legal/cookies/page.tsx",
  "apps/bridge/app/legal/disclaimer/page.tsx",
];
for (const file of required) if (!fs.existsSync(file)) throw new Error(`PRODUCT_SAFETY_FILE_MISSING:${file}`);
const cookies = fs.readFileSync("apps/bridge/hooks/use-cookies.ts", "utf8");
for (const token of ["MAX_AGE_SECONDS", "180", "SameSite=Lax", "powerchain.defai.cookie-consent.v1", "requestCookieChoices"]) if (!cookies.includes(token)) throw new Error(`COOKIE_CONSENT_GUARD_MISSING:${token}`);
const ip = fs.readFileSync("apps/backend/src/services/ip-security.ts", "utf8");
for (const token of ["x-vercel-forwarded-for", "cf-connecting-ip", "POWERCHAIN_RUNTIME_PLATFORM", "VERCEL", "pseudonymousKey", "authoritativeForWalletIdentity: false", "authoritativeForBridgeAccounting: false"]) if (!ip.includes(token)) throw new Error(`IP_SECURITY_GUARD_MISSING:${token}`);
if (ip.includes('headers.get("x-forwarded-for")') || ip.includes('headers.get("x-real-ip")')) throw new Error("GENERIC_FORWARDED_IP_TRUST_FORBIDDEN");
const durableLimiter = fs.readFileSync("apps/bridge/server/rate-limiter.ts", "utf8");
if (!durableLimiter.includes("clientIpSecurityContext")) throw new Error("DURABLE_RATE_LIMITER_MUST_USE_CANONICAL_IP_SECURITY");
if (durableLimiter.includes('headers.get("cf-connecting-ip")') || durableLimiter.includes('headers.get("x-real-ip")') || durableLimiter.includes('headers.get("x-forwarded-for")')) throw new Error("DURABLE_RATE_LIMITER_RAW_FORWARDED_IP_FORBIDDEN");
const routePolicy = fs.readFileSync("apps/bridge/server/routing/core-policy.ts", "utf8");
if (!routePolicy.includes("clientIpSecurityContext") || routePolicy.includes('headers.get("x-forwarded-for")')) throw new Error("API_ROUTE_POLICY_MUST_USE_CANONICAL_IP_SECURITY");
const solana = fs.readFileSync("programs/solana/powerchain_bridge/src/lib.rs", "utf8");
for (const token of ["DestinationRequired", "InvalidQuoteHash", "args.quote_hash != [0u8; 32]"]) if (!solana.includes(token)) throw new Error(`SOLANA_PROGRAM_HARDENING_MISSING:${token}`);
const sui = fs.readFileSync("contracts/sui/powerchain_bridge/sources/powerchain_bridge.move", "utf8");
for (const token of ["E_INVALID_DESTINATION", "is_all_zero(quote_hash)", "std::string::bytes(&destination)"]) if (!sui.includes(token)) throw new Error(`SUI_PROGRAM_HARDENING_MISSING:${token}`);
console.log(`product-safety-production-check: PASS (${required.length} required files)`);
