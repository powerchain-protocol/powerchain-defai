import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const must = (value, message) => { if (!value) throw new Error(message); };

const endpoints = read("apps/bridge/backend/endpoints.ts");
const client = read("apps/bridge/backend/provider-client.ts");
const route = read("apps/bridge/app/api/v1/providers/diagnostics/route.ts");
const types = read("apps/bridge/types/providers.ts");
const validation = read("apps/bridge/lib/data/runtime-validation.ts");
const card = read("apps/bridge/components/integrations/provider-diagnostics-card.tsx");
const page = read("apps/bridge/app/integrations/page.tsx");

must(endpoints.includes('diagnostics: "/api/v1/providers/diagnostics"'), "Provider diagnostics missing from canonical endpoint registry");
must(client.includes("diagnostics(options") && client.includes("unwrapApiData"), "Provider client must support typed diagnostics and API envelopes");
must(types.includes("ProviderDiagnosticsPayload") && types.includes("ProviderDiagnosticMetrics"), "Provider diagnostics types missing");
must(validation.includes("isProviderDiagnosticsPayload") && validation.includes("diagnosticMetricNames"), "Provider diagnostics runtime validation missing");
must(route.includes("checkProviderHealth") && route.includes("authoritativeForAccounting: false") && route.includes("requestId(req)"), "Provider diagnostics route must be evidence-based, non-authoritative, and request-scoped");
must(route.includes("return ok(data, 200"), "Provider diagnostics snapshots must remain inspectable with HTTP 200 even when providers are unavailable; readiness is the fail-closed gate");
must(!route.includes("getSuiRpc"), "Provider diagnostics must not bypass the configured Sui gRPC health path");
must(card.includes("providerClient.diagnostics") && card.includes("Quorum conflicts") && card.includes("process-local"), "Provider diagnostics UI is not wired");
must(page.includes("<ProviderDiagnosticsCard />"), "Integrations page must render provider diagnostics");

console.log("provider-diagnostics: PASS — canonical typed diagnostics, runtime validation, request IDs, process-local UI");
