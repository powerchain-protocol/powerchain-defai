const rawBase = process.env.POWERCHAIN_DEPLOY_BASE_URL?.trim() || process.env.POWERCHAIN_SMOKE_BASE_URL?.trim();
if (!rawBase) {
  console.error("POWERCHAIN_DEPLOY_BASE_URL (or POWERCHAIN_SMOKE_BASE_URL) is required");
  process.exit(2);
}

const base = rawBase.replace(/\/+$/, "");
const timeoutMs = Math.max(10_000, Math.min(60 * 60 * 1000, Number(process.env.POWERCHAIN_DRAIN_WAIT_TIMEOUT_MS ?? 10 * 60 * 1000) || 10 * 60 * 1000));
const intervalMs = Math.max(1_000, Math.min(30_000, Number(process.env.POWERCHAIN_DRAIN_WAIT_INTERVAL_MS ?? 5_000) || 5_000));
const requestTimeoutMs = Math.max(2_000, Math.min(30_000, Number(process.env.POWERCHAIN_SMOKE_TIMEOUT_MS ?? 10_000) || 10_000));
const deadline = Date.now() + timeoutMs;

async function readiness() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetch(`${base}/api/v1/system/readiness`, {
      headers: { accept: "application/json" },
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });
    let payload;
    try { payload = await response.json(); } catch { throw new Error(`system readiness: invalid JSON (HTTP ${response.status})`); }
    const data = payload && typeof payload === "object" && payload.ok === true && "data" in payload ? payload.data : payload;
    return { response, data };
  } finally {
    clearTimeout(timer);
  }
}

let sawDrain = false;
while (Date.now() < deadline) {
  const { response, data } = await readiness();
  const maintenance = data?.checks?.maintenance;
  if (maintenance?.draining === true) sawDrain = true;

  if (maintenance?.draining !== true) {
    if (!sawDrain) throw new Error("drain wait: runtime is not in drain mode");
    throw new Error("drain wait: drain mode was disabled before quiescence was observed");
  }

  const databaseReady = data?.checks?.database?.ready === true;
  const activeLeases = Number(maintenance?.activeLeases ?? -1);
  const quiescent = maintenance?.quiescent === true;
  console.log(JSON.stringify({ checkedAt: data?.checkedAt ?? new Date().toISOString(), httpStatus: response.status, databaseReady, activeLeases, quiescent }));

  if (response.ok && databaseReady && quiescent && activeLeases === 0) {
    console.log(JSON.stringify({ ok: true, base, quiescent: true, checkedAt: data.checkedAt }, null, 2));
    process.exit(0);
  }

  await new Promise((resolve) => setTimeout(resolve, intervalMs));
}
throw new Error(`drain wait timed out after ${timeoutMs}ms`);
