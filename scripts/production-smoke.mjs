const rawBase = process.env.POWERCHAIN_SMOKE_BASE_URL?.trim();
if (!rawBase) {
  console.error("POWERCHAIN_SMOKE_BASE_URL is required, for example https://app.powerchain.example");
  process.exit(2);
}
let parsedBase;
try { parsedBase = new URL(rawBase); } catch { throw new Error("POWERCHAIN_SMOKE_BASE_URL must be a valid absolute URL"); }
const localHost = ["localhost", "127.1.0.1", "::1"].includes(parsedBase.hostname);
if (parsedBase.protocol !== "https:" && !(localHost && parsedBase.protocol === "http:")) {
  throw new Error("POWERCHAIN_SMOKE_BASE_URL must use HTTPS outside localhost");
}
if ((parsedBase.pathname && parsedBase.pathname !== "/") || parsedBase.search || parsedBase.hash || parsedBase.username || parsedBase.password) {
  throw new Error("POWERCHAIN_SMOKE_BASE_URL must be an origin URL without path, query, fragment, or credentials");
}
const base = parsedBase.origin;
const configuredSmokeKey = process.env.POWERCHAIN_SMOKE_API_KEY?.trim() || "";
const configuredRuntimeKey = (process.env.POWERCHAIN_API_KEYS ?? "").split(",").map((entry) => entry.trim()).find((entry) => entry.length >= 24 && entry.length <= 256) || "";
const smokeApiKey = configuredSmokeKey || configuredRuntimeKey;
const timeoutMs = Math.max(2_000, Math.min(30_000, Number(process.env.POWERCHAIN_SMOKE_TIMEOUT_MS ?? 10_000) || 10_000));
const attempts = Math.max(1, Math.min(5, Number(process.env.POWERCHAIN_SMOKE_ATTEMPTS ?? 3) || 3));
const retryDelayMs = Math.max(100, Math.min(5_000, Number(process.env.POWERCHAIN_SMOKE_RETRY_DELAY_MS ?? 750) || 750));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestOnce(pathname) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${base}${pathname}`, {
      headers: {
        accept: "application/json",
        "user-agent": "PowerChain-Production-Smoke/1.0",
        ...(smokeApiKey ? { "x-api-key": smokeApiKey } : {}),
      },
      cache: "no-store",
      signal: controller.signal,
      redirect: "error",
    });
  } finally {
    clearTimeout(timer);
  }
}

async function request(pathname) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await requestOnce(pathname);
      if (response.status < 500 || attempt === attempts) return response;
      lastError = new Error(`${pathname}: HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
    }
    await sleep(retryDelayMs * attempt);
  }
  throw lastError ?? new Error(`${pathname}: request failed`);
}

async function json(response, label) {
  let body;
  try { body = await response.json(); } catch { throw new Error(`${label}: invalid JSON`); }
  return body && typeof body === "object" && body.ok === true && "data" in body ? body.data : body;
}

function assertSecurityHeaders(response, label) {
  const expected = {
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
  };
  for (const [name, expectedValue] of Object.entries(expected)) {
    const actual = response.headers.get(name);
    if (actual !== expectedValue) throw new Error(`${label}: expected ${name}=${expectedValue}, got ${String(actual)}`);
  }
}

const healthResponse = await request("/api/v1/health");
if (healthResponse.status === 401 && !smokeApiKey) throw new Error("health: API key required; set POWERCHAIN_SMOKE_API_KEY for production smoke checks");
if (!healthResponse.ok) throw new Error(`health: HTTP ${healthResponse.status}`);
assertSecurityHeaders(healthResponse, "health");
const health = await json(healthResponse, "health");
if (health?.ok !== true || health?.version !== "1.0.0") throw new Error("health: unexpected payload");

const readyResponse = await request("/api/v1/ready");
if (!readyResponse.ok) throw new Error(`ready: HTTP ${readyResponse.status}`);
const ready = await json(readyResponse, "ready");
if (ready?.ready !== true) throw new Error("ready: execution providers/database not ready");

const systemResponse = await request("/api/v1/system/readiness");
if (!systemResponse.ok) throw new Error(`system readiness: HTTP ${systemResponse.status}`);
const system = await json(systemResponse, "system readiness");
if (system?.state !== "ready") throw new Error(`system readiness: expected ready, got ${String(system?.state)}`);
if (system?.capabilities?.newOperations !== true || system?.capabilities?.asyncSettlement !== true) throw new Error("system readiness: execution capabilities not ready");

const policyResponse = await request("/api/v1/system/route-policy");
if (!policyResponse.ok) throw new Error(`route policy: HTTP ${policyResponse.status}`);
const policy = await json(policyResponse, "route policy");
if (policy?.limiter?.pressure !== "normal") throw new Error(`route policy: pressure=${String(policy?.limiter?.pressure)}`);

console.log(JSON.stringify({
  ok: true,
  base,
  version: health.version,
  systemState: system.state,
  attempts,
  authenticated: Boolean(smokeApiKey),
  checkedAt: new Date().toISOString(),
}, null, 2));
