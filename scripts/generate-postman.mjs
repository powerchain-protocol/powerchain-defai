import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const actionsPath = path.join(root, "shared/actions.json");
const outDir = path.join(root, "api", "postman");
const collectionPath = path.join(outDir, "PowerChain-DeFAI.postman_collection.json");
const environmentPath = path.join(outDir, "PowerChain-DeFAI.local.postman_environment.json");
const productionEnvironmentPath = path.join(outDir, "PowerChain-DeFAI.production.postman_environment.json");
const methodsCollectionPath = path.join(outDir, "PowerChain-DeFAI.methods.postman_collection.json");
const apiDocsPath = path.join(outDir, "API_DOCS.md");
const check = process.argv.includes("--check");

const { actions } = JSON.parse(fs.readFileSync(actionsPath, "utf8"));

const postmanSpecificationUrl = "https://crimson-crescent-8585.postman.co/workspace/55a50a8b-cdb7-46f5-807e-3494d0262565/specification/1afb4b8d-159d-4f42-8805-f1f1a5143539/file/04e6ee61-ea2e-4c44-83c6-51471951a035";

function exampleResponseFor(action, request) {
  const body = {
    ok: true,
    example: true,
    authoritative: false,
    method: action.method,
    path: action.path,
    note: "Illustrative Postman example only; actual response schema is defined by OpenAPI and runtime behavior.",
  };
  return {
    name: "Illustrative 200 response",
    originalRequest: request,
    status: "OK",
    code: 200,
    _postman_previewlanguage: "json",
    header: [{ key: "Content-Type", value: "application/json" }],
    cookie: [],
    body: JSON.stringify(body, null, 2),
  };
}
function title(value) { return value.split(/[._-]/).filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(" "); }
function folderName(action) { const rest = action.path.replace(/^\/api\/v1\//, ""); return title((rest.split("/")[0] || "root").replace(/^:/, "parameter")); }
function baseVariableFor(action) {
  if (action.path.startsWith("/api/v1/bridge/")) return "bridgeUrl";
  if (action.path.startsWith("/api/v1/swap/")) return "swapUrl";
  return "baseUrl";
}

function bodyTemplate(action) {
  const templates = {
    "/api/v1/swap/quote": `{
  "payer": "{{suiWallet}}",
  "fromCoinType": "{{suiInputCoinType}}",
  "toCoinType": "{{suiOutputCoinType}}",
  "amountBaseUnits": "{{swapAmountBaseUnits}}",
  "slippageBps": {{slippageBps}}
}`,
    "/api/v1/swap/transaction": `{
  "payer": "{{suiWallet}}",
  "fromCoinType": "{{suiInputCoinType}}",
  "toCoinType": "{{suiOutputCoinType}}",
  "amountBaseUnits": "{{swapAmountBaseUnits}}",
  "slippageBps": {{slippageBps}},
  "minimumOutBaseUnits": "{{suiMinimumOutBaseUnits}}"
}`,
    "/api/v1/swap/solana/order": `{
  "payer": "{{solanaWallet}}",
  "inputMint": "{{solanaInputMint}}",
  "outputMint": "{{solanaOutputMint}}",
  "amountBaseUnits": "{{swapAmountBaseUnits}}",
  "slippageBps": {{slippageBps}}
}`,
    "/api/v1/swap/solana/execute": `{
  "payer": "{{solanaWallet}}",
  "signedTransaction": "{{signedTransaction}}",
  "requestId": "{{jupiterRequestId}}",
  "inputMint": "{{solanaInputMint}}",
  "outputMint": "{{solanaOutputMint}}",
  "amountBaseUnits": "{{swapAmountBaseUnits}}",
  "slippageBps": {{slippageBps}},
  "minimumOutputBaseUnits": "{{jupiterMinimumOutputBaseUnits}}"
}`,
    "/api/v1/bridge/quote": `{
  "direction": "{{bridgeDirection}}",
  "principalBaseUnits": "{{bridgePrincipalBaseUnits}}",
  "sourceAddress": "{{bridgeSourceAddress}}",
  "destinationAddress": "{{bridgeDestinationAddress}}"
}`,
    "/api/v1/bridge/transfers": `{
  "quoteId": "{{bridgeQuoteId}}",
  "intentCommitment": "{{bridgeIntentCommitment}}",
  "runtimeSnapshotId": "{{bridgeRuntimeSnapshotId}}"
}`,
  };
  return templates[action.path] ?? "{}";
}

function requestFor(action) {
  const pathValue = action.path.replace(/:([A-Za-z0-9_]+)/g, "{{$1}}");
  const headers = [{ key: "Accept", value: "application/json" }, { key: "X-Api-Key", value: "{{apiKey}}" }];
  const request = {
    method: action.method,
    header: headers,
    url: `{{${baseVariableFor(action)}}}${pathValue}`,
    description: `${action.name} · ${action.auth} · ${action.idempotent ? "idempotent" : "mutation"}`,
  };
  if (["POST", "PUT", "PATCH"].includes(action.method)) {
    headers.push({ key: "Content-Type", value: "application/json" });
    request.body = { mode: "raw", raw: bodyTemplate(action), options: { raw: { language: "json" } } };
  }
  return { name: title(action.name), request, response: [exampleResponseFor(action, request)] };
}
const groups = new Map();
for (const action of actions) {
  const group = folderName(action);
  const items = groups.get(group) ?? [];
  items.push(requestFor(action));
  groups.set(group, items);
}
const collection = {
  info: {
    name: "PowerChain DeFAI API 1.0.0",
    description: "PowerChain | DeFAI API Docs. Generated from shared/actions.json. Use the combined collection for shared services, Bridge, and Swap; import api/swagger.yaml or /api/v1/openapi for the full OpenAPI schema. Bridge and Swap also have independent collections under api/bridge and api/swap. X-Api-Key is supported through {{apiKey}}. Never store wallet secrets, treasury keys, provider credentials, or signing material in shared Postman environments.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  variable: [
    { key: "baseUrl", value: "https://powerchain.app", type: "string" },
    { key: "swapUrl", value: "https://swap.powerchain.app", type: "string" },
    { key: "bridgeUrl", value: "https://bridge.powerchain.app", type: "string" },
    { key: "apiKey", value: "", type: "string" },
    { key: "id", value: "replace-me", type: "string" },
    { key: "transferId", value: "replace-me", type: "string" },
    { key: "suiWallet", value: "", type: "string" },
    { key: "suiInputCoinType", value: "", type: "string" },
    { key: "suiOutputCoinType", value: "0x2::sui::SUI", type: "string" },
    { key: "solanaWallet", value: "", type: "string" },
    { key: "solanaInputMint", value: "", type: "string" },
    { key: "solanaOutputMint", value: "", type: "string" },
    { key: "swapAmountBaseUnits", value: "1000000000", type: "string" },
    { key: "slippageBps", value: "50", type: "string" },
    { key: "suiMinimumOutBaseUnits", value: "", type: "string" },
    { key: "signedTransaction", value: "", type: "string" },
    { key: "jupiterRequestId", value: "", type: "string" },
    { key: "jupiterMinimumOutputBaseUnits", value: "", type: "string" },
    { key: "bridgeDirection", value: "SUI_TO_SOLANA", type: "string" },
    { key: "bridgePrincipalBaseUnits", value: "1000000000", type: "string" },
    { key: "bridgeSourceAddress", value: "", type: "string" },
    { key: "bridgeDestinationAddress", value: "", type: "string" },
    { key: "bridgeQuoteId", value: "", type: "string" },
    { key: "bridgeIntentCommitment", value: "", type: "string" },
    { key: "bridgeRuntimeSnapshotId", value: "", type: "string" },
  ],
  item: [...groups.entries()].sort(([a],[b]) => a.localeCompare(b)).map(([name,item]) => ({name,item}))
};

function environmentValues(overrides) {
  return collection.variable.map((variable) => ({
    key: variable.key,
    value: Object.prototype.hasOwnProperty.call(overrides, variable.key) ? overrides[variable.key] : variable.value,
    enabled: true,
  }));
}

const methodGroups = new Map();
for (const action of actions) {
  const items = methodGroups.get(action.method) ?? [];
  items.push(requestFor(action));
  methodGroups.set(action.method, items);
}
const methodsCollection = {
  info: {
    name: "PowerChain DeFAI API by HTTP Method 1.0.0",
    description: "Generated from shared/actions.json. Requests are grouped under GET, POST and PUT folders and include sanitized illustrative response examples. Use OpenAPI and live responses as the authoritative runtime contract.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  variable: collection.variable,
  event: [{
    listen: "test",
    script: {
      type: "text/javascript",
      exec: [
        "pm.test('response is not a server error', function () {",
        "  pm.expect(pm.response.code).to.be.below(500);",
        "});",
      ],
    },
  }],
  item: [...methodGroups.entries()]
    .sort(([a],[b]) => a.localeCompare(b))
    .map(([name,item]) => ({ name, item: item.sort((a,b) => String(a.request?.url).localeCompare(String(b.request?.url))) })),
};

function markdownApiDocs() {
  const grouped = new Map();
  for (const action of actions) {
    const group = folderName(action);
    const items = grouped.get(group) ?? [];
    items.push(action);
    grouped.set(group, items);
  }
  const lines = [
    "# PowerChain | DeFAI API Docs",
    "",
    "PowerChain DeFAI exposes versioned APIs for shared protocol data, wallet-safe DeFi operations, Bridge settlement orchestration, Swap execution, portfolio/liquidity observations, security policy, and runtime diagnostics.",
    "",
    "> Postman is a client and testing surface only. It does not replace wallet signatures, on-chain finality, Wormhole NTT reconciliation, or server-side authorization.",
    "",
    "## Production endpoints",
    "",
    "| Surface | Base URL | Purpose |",
    "| --- | --- | --- |",
    "| DeFAI/shared API | `https://powerchain.app` | Shared runtime, tokens, currencies, RPC, portfolio, security, market data and common services |",
    "| Swap API | `https://swap.powerchain.app` | `/api/v1/swap/*` execution and quote services |",
    "| Bridge API | `https://bridge.powerchain.app` | `/api/v1/bridge/*` quote, transfer, history, events and runtime services |",
    "",
    "The combined Postman collection automatically routes Bridge calls through `{{bridgeUrl}}`, Swap calls through `{{swapUrl}}`, and all other calls through `{{baseUrl}}`.",
    "",
    "## Authentication",
    "",
    "The OpenAPI contracts define an API-key scheme using the `X-Api-Key` header:",
    "",
    "```http",
    "X-Api-Key: {{apiKey}}",
    "```",
    "",
    "Runtime policy is controlled server-side by `POWERCHAIN_API_KEY_MODE=off|optional|required`. Never commit production API keys into Postman collections or environments.",
    "",
    "## Import into Postman",
    "",
    "1. Import `PowerChain-DeFAI.postman_collection.json` for domain-oriented navigation.",
    "2. Import `PowerChain-DeFAI.methods.postman_collection.json` when you want requests grouped explicitly under `GET`, `POST`, and `PUT` folders with saved response examples.",
    "3. Import `PowerChain-DeFAI.local.postman_environment.json` for local development or `PowerChain-DeFAI.production.postman_environment.json` for production hosts.",
    "4. Set the `apiKey` environment variable only when the selected environment requires one.",
    "5. Add test data from `datasets/PowerChain-DeFAI.dataset.csv` when creating a Postman dataset/data source.",
    "6. Use the split collections under `../bridge/postman/` and `../swap/postman/` when you want domain-isolated testing.",
    "7. For schema-first workflows, import `../swagger.yaml`, `../bridge/openapi.yaml`, or `../swap/openapi.yaml` directly into Postman.",
    "",
    `Workspace specification reference (requires access to the configured Postman workspace): ${postmanSpecificationUrl}`,
    "",
    "## Postman Flow architecture",
    "",
    "The visual workflow design for Platform Preflight, Sui Swap, Solana/Jupiter Swap, and Bridge Create & Monitor is documented in `docs/POSTMAN_FLOWS_ARCHITECTURE.md`. It defines Start inputs, Validate/Condition/Evaluate/Delay blocks, request-body mappings, captured variables, and the external wallet-signature boundary.",
    "",
    "## Specs, flows and mocks",
    "",
    "| Artifact | Path | Purpose |",
    "| --- | --- | --- |",
    "| Specs | `api/postman/specs/PowerChain-DeFAI.postman_specs.json` | Machine-readable action/domain/auth/idempotency inventory |",
    "| Runner flows | `api/postman/flows/PowerChain-DeFAI.flows.postman_collection.json` | Ordered preflight, Swap and Bridge workflows for Collection Runner |",
    "| Flow manifest | `api/postman/flows/PowerChain-DeFAI.flows.json` | Declarative source describing flow steps and safety boundaries |",
    "| Method collection | `api/postman/PowerChain-DeFAI.methods.postman_collection.json` | Requests grouped by HTTP method with sanitized saved response examples |",
    "| Datasets | `api/postman/datasets/` | CSV input for Postman datasets/data-driven runs |",
    "| Mocks | `api/postman/mocks/PowerChain-DeFAI.mocks.postman_collection.json` | Saved examples for Postman mock servers |",
    "",
    "Mock fixtures always declare `mock: true` and `authoritativeForBridgeAccounting: false`. A mocked quote, transaction, balance or runtime response is never evidence that a wallet signed, a transaction executed, or Wormhole NTT settled principal.",
    "",
    "## Transaction safety",
    "",
    "- The connected wallet remains the transaction signer and network-fee payer for wallet-owned Swap and Bridge flows.",
    "- Bridge principal movement remains Wormhole NTT-only; API responses, Postman results, explorer visibility, AI output, and market data are not settlement authority.",
    "- Market prices, rates, pool observations, portfolio data, worker readiness and RPC diagnostics are informational and are never authoritative for Bridge accounting.",
    "- Quote freshness, payer validation, source-balance checks, minimum received and route-specific validation still apply when a transaction is prepared from an API response.",
    "",
    "## Core contracts",
    "",
    "| Contract | Runtime endpoint | Checked-in contract |",
    "| --- | --- | --- |",
    "| Combined DeFAI | `GET /api/v1/openapi` | `api/swagger.yaml` |",
    "| Bridge | `GET /api/v1/bridge/openapi` | `api/bridge/openapi.yaml` |",
    "| Swap | `GET /api/v1/swap/openapi` | `api/swap/openapi.yaml` |",
    "",
    "## Endpoint inventory",
    "",
  ];
  for (const [group, items] of [...grouped.entries()].sort(([a],[b]) => a.localeCompare(b))) {
    lines.push(`### ${group}`, "");
    lines.push("| Method | Path | Action |", "| --- | --- | --- |");
    for (const action of items.sort((a,b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method))) {
      lines.push(`| \`${action.method}\` | \`${action.path}\` | \`${action.name}\` |`);
    }
    lines.push("");
  }
  lines.push(
    "## Regeneration",
    "",
    "```bash",
    "pnpm postman:generate",
    "pnpm postman:check",
    "pnpm api:contracts:generate",
    "pnpm api:contracts:check",
    "```",
    "",
    "The Postman collection, environments and this API document are generated from repository contracts. Edit the generators or canonical route registry rather than hand-editing generated output.",
  );
  return `${lines.join("\n")}\n`;
}

const environment = {
  id: "powerchain-defai-local-1-0-0",
  name: "PowerChain DeFAI · Local",
  values: environmentValues({
    baseUrl: "http://localhost:3000",
    swapUrl: "http://localhost:3000",
    bridgeUrl: "http://localhost:3000",
  }),
  _postman_variable_scope: "environment",
  _postman_exported_using: "PowerChain DeFAI source generator"
};

const productionEnvironment = {
  id: "powerchain-defai-production-1-0-0",
  name: "PowerChain DeFAI · Production",
  values: environmentValues({
    baseUrl: "https://powerchain.app",
    swapUrl: "https://swap.powerchain.app",
    bridgeUrl: "https://bridge.powerchain.app",
  }),
  _postman_variable_scope: "environment",
  _postman_exported_using: "PowerChain DeFAI source generator"
};
const files = [[collectionPath, JSON.stringify(collection,null,2)+"\n"],[methodsCollectionPath, JSON.stringify(methodsCollection,null,2)+"\n"],[environmentPath, JSON.stringify(environment,null,2)+"\n"],[productionEnvironmentPath, JSON.stringify(productionEnvironment,null,2)+"\n"],[apiDocsPath, markdownApiDocs()]];
if (check) {
  let ok = true;
  for (const [file, expected] of files) {
    if (!fs.existsSync(file) || fs.readFileSync(file,"utf8") !== expected) { console.error(`Stale Postman artifact: ${path.relative(root,file)}`); ok = false; }
  }
  if (!ok) process.exit(1);
  console.log(`Postman artifacts current (${actions.length} actions)`);
} else {
  fs.mkdirSync(outDir,{recursive:true});
  for (const [file, value] of files) fs.writeFileSync(file,value);
  console.log(`Generated Postman collections/environments from ${actions.length} actions`);
}
