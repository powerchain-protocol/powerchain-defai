#!/usr/bin/env node

const base = (process.env.POWERCHAIN_DEPLOY_BASE_URL || process.env.POWERCHAIN_SMOKE_BASE_URL || "").replace(/\/$/, "");
const token = process.env.POWERCHAIN_OPERATOR_API_TOKEN || "";
if (!base) throw new Error("POWERCHAIN_DEPLOY_BASE_URL_REQUIRED");
if (!token) throw new Error("POWERCHAIN_OPERATOR_API_TOKEN_REQUIRED");
const command = (process.argv[2] || "get").toLowerCase();
if (!["get", "drain", "resume"].includes(command)) throw new Error("USAGE: pnpm operator:maintenance -- get|drain|resume [reason]");
const headers = { authorization: `Bearer ${token}`, accept: "application/json" };
async function request(method, body) {
  const response = await fetch(`${base}/api/v1/operator/maintenance`, { method, headers: body ? { ...headers, "content-type": "application/json" } : headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok !== true) throw new Error(`MAINTENANCE_${method}_FAILED:${response.status}:${payload?.error?.code || "UNKNOWN"}`);
  return payload.data;
}
const current = await request("GET");
if (command === "get") { console.log(JSON.stringify(current, null, 2)); process.exit(0); }
if (current.environmentOverride && command === "resume") throw new Error("MAINTENANCE_ENV_OVERRIDE_ACTIVE");
const reason = process.argv.slice(3).join(" ").trim() || (command === "drain" ? "operator requested drain" : "operator requested resume");
const next = await request("PUT", { draining: command === "drain", expectedRevision: current.revision, reason });
console.log(JSON.stringify(next, null, 2));
