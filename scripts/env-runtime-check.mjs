const profile = (process.argv[2] || "production").trim().toLowerCase();
if (profile !== "production") throw new Error(`Unsupported runtime profile: ${profile}`);

const errors = [];
const warnings = [];
const value = (name) => process.env[name]?.trim() || "";
const enabled = (name, fallback = false) => {
  const raw = value(name);
  if (!raw) return fallback;
  return raw.toLowerCase() === "true";
};
const requireValue = (name) => {
  const current = value(name);
  if (!current) errors.push(`${name} is required`);
  return current;
};
const rejectLocalUrl = (name, current) => {
  if (!current) return;
  try {
    const url = new URL(current);
    const host = url.hostname.toLowerCase();
    if (["localhost", "127.1.0.1", "::1"].includes(host)) errors.push(`${name} must not point to localhost in production`);
  } catch {
    errors.push(`${name} must be a valid URL`);
  }
};
const rejectPlaceholder = (name, current) => {
  if (!current) return;
  if (/^(changeme|replace-me|example|tba|todo|your[-_])/i.test(current) || /<[^>]+>/.test(current)) {
    errors.push(`${name} contains a placeholder value`);
  }
};

const databaseUrl = requireValue("DATABASE_URL");
rejectLocalUrl("DATABASE_URL", databaseUrl);
rejectPlaceholder("DATABASE_URL", databaseUrl);

for (const name of [
  "POWERCHAIN_PWRC_EXPECTED_SUPPLY_BASE_UNITS",
  "POWERCHAIN_PWRC_EXPECTED_DECIMALS",
  "POWERCHAIN_SERVICE_FEE_SOLANA_WALLET",
  "POWERCHAIN_SOLANA_RPC_URL",
  "POWERCHAIN_SUI_RPC_URL",
]) {
  const current = requireValue(name);
  rejectPlaceholder(name, current);
}
rejectLocalUrl("POWERCHAIN_SOLANA_RPC_URL", value("POWERCHAIN_SOLANA_RPC_URL"));
rejectLocalUrl("POWERCHAIN_SUI_RPC_URL", value("POWERCHAIN_SUI_RPC_URL"));

if (value("POWERCHAIN_SOLANA_NETWORK") !== "mainnet-beta") errors.push("POWERCHAIN_SOLANA_NETWORK must be mainnet-beta for production");
if (value("POWERCHAIN_SUI_NETWORK") !== "mainnet") errors.push("POWERCHAIN_SUI_NETWORK must be mainnet for production");
if (value("POWERCHAIN_API_KEY_MODE") !== "required") errors.push("POWERCHAIN_API_KEY_MODE must be required for production");
const apiKeys = requireValue("POWERCHAIN_API_KEYS");
rejectPlaceholder("POWERCHAIN_API_KEYS", apiKeys);
const apiKeyValues = apiKeys.split(",").map((entry) => entry.trim()).filter(Boolean);
const validApiKeys = apiKeyValues.filter((entry) => entry.length >= 24 && entry.length <= 256);
if (validApiKeys.length === 0) errors.push("POWERCHAIN_API_KEYS must contain at least one 24-256 character API key");
if (new Set(validApiKeys).size !== validApiKeys.length) errors.push("POWERCHAIN_API_KEYS must not contain duplicate valid keys");
if (apiKeyValues.some((entry) => entry.length > 256)) errors.push("POWERCHAIN_API_KEYS entries must be at most 256 characters");

if (enabled("ENABLE_BRIDGE", true) || enabled("ENABLE_CROSS_CHAIN", true) || enabled("WORMHOLE_ENABLED", true)) {
  if (value("POWERCHAIN_WORMHOLE_NETWORK") !== "mainnet") errors.push("POWERCHAIN_WORMHOLE_NETWORK must be mainnet when bridge/cross-chain is enabled");
  for (const name of [
    "POWERCHAIN_NTT_SOLANA_MANAGER",
    "POWERCHAIN_NTT_SOLANA_EMITTER",
    "POWERCHAIN_NTT_SOLANA_TRANSCEIVER",
    "POWERCHAIN_NTT_SUI_MANAGER",
    "POWERCHAIN_NTT_SUI_EMITTER",
    "POWERCHAIN_NTT_SUI_TRANSCEIVER",
  ]) {
    const current = requireValue(name);
    rejectPlaceholder(name, current);
  }
}

const corsOrigins = value("POWERCHAIN_CORS_ORIGINS").split(",").map((entry) => entry.trim()).filter(Boolean);
if (corsOrigins.includes("*")) errors.push("POWERCHAIN_CORS_ORIGINS must use exact origins; wildcard origins are not allowed");
if (new Set(corsOrigins).size !== corsOrigins.length) errors.push("POWERCHAIN_CORS_ORIGINS must not contain duplicate origins");
for (const origin of corsOrigins) {
  try {
    const url = new URL(origin);
    if (url.origin !== origin || url.username || url.password || url.search || url.hash || (url.pathname !== "/" && url.pathname !== "")) {
      errors.push(`POWERCHAIN_CORS_ORIGINS entry must be an exact origin without path/query/credentials: ${origin}`);
    }
    if (url.protocol !== "https:") errors.push(`POWERCHAIN_CORS_ORIGINS entry must use HTTPS in production: ${origin}`);
  } catch {
    errors.push(`POWERCHAIN_CORS_ORIGINS contains an invalid origin: ${origin}`);
  }
}

const jupiterUserHosts = value("POWERCHAIN_JUPITER_USER_API_HOSTS").split(",").map((entry) => entry.trim().toLowerCase()).filter(Boolean);
if (new Set(jupiterUserHosts).size !== jupiterUserHosts.length) errors.push("POWERCHAIN_JUPITER_USER_API_HOSTS must not contain duplicate hosts");
for (const host of jupiterUserHosts) {
  if (host.includes("://") || host.includes("/") || host.includes("?") || host.includes("#") || host.includes("@")) {
    errors.push(`POWERCHAIN_JUPITER_USER_API_HOSTS entries must be hostnames only: ${host}`);
    continue;
  }
  if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(host)) {
    errors.push(`POWERCHAIN_JUPITER_USER_API_HOSTS contains an invalid hostname: ${host}`);
    continue;
  }
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) {
    errors.push(`POWERCHAIN_JUPITER_USER_API_HOSTS must use a public operator-reviewed DNS hostname: ${host}`);
  }
}

if (enabled("NEXT_PUBLIC_CLOUDFLARE_ENABLED")) {
  const platform = value("POWERCHAIN_RUNTIME_PLATFORM");
  if (platform && platform !== "cloudflare") errors.push("POWERCHAIN_RUNTIME_PLATFORM must be cloudflare when NEXT_PUBLIC_CLOUDFLARE_ENABLED=true");
  if (!platform) warnings.push("POWERCHAIN_RUNTIME_PLATFORM is not set locally; Cloudflare deployment config must provide cloudflare at runtime");
  warnings.push("Cloudflare runtime enabled: verify Worker secrets/bindings separately because encrypted platform secrets are not readable during source preflight.");
}

if (errors.length) {
  console.error("env-runtime-check: FAIL");
  for (const error of errors) console.error(`- ${error}`);
  if (warnings.length) for (const warning of warnings) console.error(`! ${warning}`);
  process.exit(1);
}

console.log(`env-runtime-check: PASS (${profile})`);
for (const warning of warnings) console.log(`! ${warning}`);
