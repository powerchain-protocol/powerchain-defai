import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const requireToken = (source, token, label) => {
  if (!source.includes(token)) throw new Error(`${label}:${token}`);
};

const ip = read("apps/backend/src/services/ip-security.ts");
for (const token of ["POWERCHAIN_RUNTIME_PLATFORM", "cloudflare", "cf-connecting-ip", "x-vercel-forwarded-for", "pseudonymousKey"]) {
  requireToken(ip, token, "RUNTIME_TRUST_IP_SECURITY_MISSING");
}
for (const forbidden of ['headers.get("x-forwarded-for")', 'headers.get("x-real-ip")']) {
  if (ip.includes(forbidden)) throw new Error(`RUNTIME_TRUST_GENERIC_FORWARDED_HEADER_FORBIDDEN:${forbidden}`);
}

const durable = read("apps/bridge/server/rate-limiter.ts");
requireToken(durable, "clientIpSecurityContext", "RUNTIME_TRUST_DURABLE_LIMITER_MISSING");
for (const forbidden of ['headers.get("cf-connecting-ip")', 'headers.get("x-forwarded-for")', 'headers.get("x-real-ip")']) {
  if (durable.includes(forbidden)) throw new Error(`RUNTIME_TRUST_DURABLE_RAW_IP_FORBIDDEN:${forbidden}`);
}

const wrangler = read("apps/bridge/wrangler.jsonc");
for (const token of ['"POWERCHAIN_RUNTIME_PLATFORM": "cloudflare"', '"nodejs_compat"']) {
  requireToken(wrangler, token, "RUNTIME_TRUST_CLOUDFLARE_BINDING_MISSING");
}

const smoke = read("scripts/production-smoke.mjs");
for (const token of ["POWERCHAIN_SMOKE_API_KEY", '"x-api-key"', "must use HTTPS outside localhost", "authenticated: Boolean(smokeApiKey)"]) {
  requireToken(smoke, token, "RUNTIME_TRUST_SMOKE_GUARD_MISSING");
}

const envRuntime = read("scripts/env-runtime-check.mjs");
for (const token of ["24-256 character API key", "duplicate valid keys", "POWERCHAIN_RUNTIME_PLATFORM"]) {
  requireToken(envRuntime, token, "RUNTIME_TRUST_ENV_GUARD_MISSING");
}

const routes = read("apps/backend/src/routing/routes.ts");
for (const token of ['id: "version"', 'path: "/api/v1/version"']) {
  requireToken(routes, token, "RUNTIME_TRUST_VERSION_ROUTE_MISSING");
}

console.log("runtime-trust-production-check: PASS — platform IP trust, pseudonymous durable limits, authenticated smoke and version policy");
