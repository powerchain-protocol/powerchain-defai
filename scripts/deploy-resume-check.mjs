const rawBase = process.env.POWERCHAIN_DEPLOY_BASE_URL?.trim() || process.env.POWERCHAIN_SMOKE_BASE_URL?.trim();
if (!rawBase) {
  console.error("POWERCHAIN_DEPLOY_BASE_URL (or POWERCHAIN_SMOKE_BASE_URL) is required");
  process.exit(2);
}
const base = rawBase.replace(/\/+$/, "");
const timeoutMs = Math.max(2_000, Math.min(30_000, Number(process.env.POWERCHAIN_SMOKE_TIMEOUT_MS ?? 10_000) || 10_000));

async function get(pathname) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${base}${pathname}`, { headers: { accept: "application/json" }, cache: "no-store", redirect: "error", signal: controller.signal });
    let payload;
    try { payload = await response.json(); } catch { throw new Error(`${pathname}: invalid JSON`); }
    const data = payload && typeof payload === "object" && payload.ok === true && "data" in payload ? payload.data : payload;
    return { response, data };
  } finally { clearTimeout(timer); }
}

const { response, data } = await get("/api/v1/system/readiness");
if (!response.ok) throw new Error(`resume check: system readiness HTTP ${response.status}`);
if (data?.checks?.maintenance?.draining !== false) throw new Error("resume check: drain mode is still enabled");
if (data?.capabilities?.newOperations !== true) throw new Error("resume check: new operations are not ready");
if (data?.capabilities?.asyncSettlement !== true) throw new Error("resume check: async settlement is not ready");
if (data?.checks?.database?.ready !== true || data?.checks?.providers?.ready !== true || data?.checks?.workers?.ready !== true) {
  throw new Error("resume check: database/providers/workers are not all ready");
}
console.log(JSON.stringify({ ok: true, base, state: data.state, checkedAt: data.checkedAt, queuePressure: data?.checks?.queues?.pressure }, null, 2));
