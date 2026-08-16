import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const check = process.argv.includes("--check");
const { actions } = JSON.parse(fs.readFileSync(path.join(root, "shared/actions.json"), "utf8"));
const outRoot = path.join(root, "api", "postman");
const specsDir = path.join(outRoot, "specs");
const flowsDir = path.join(outRoot, "flows");
const mocksDir = path.join(outRoot, "mocks");

const domains = {
  shared: { baseVariable: "baseUrl", baseUrl: "https://powerchain.app" },
  bridge: { baseVariable: "bridgeUrl", baseUrl: "https://bridge.powerchain.app" },
  swap: { baseVariable: "swapUrl", baseUrl: "https://swap.powerchain.app" },
};

function domainForPath(value) {
  if (value.startsWith("/api/v1/bridge/")) return "bridge";
  if (value.startsWith("/api/v1/swap/")) return "swap";
  return "shared";
}
function title(value) {
  return value.split(/[._-]/).filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
}
function variablePath(value) { return value.replace(/:([A-Za-z0-9_]+)/g, "{{$1}}"); }
function action(method, pathValue) { return actions.find((item) => item.method === method && item.path === pathValue); }
function requestFor(actionValue, extra = {}) {
  if (!actionValue) throw new Error(`Missing flow action: ${JSON.stringify(extra)}`);
  const domain = domainForPath(actionValue.path);
  const headers = [
    { key: "Accept", value: "application/json" },
    { key: "X-Api-Key", value: "{{apiKey}}" },
    ...(extra.headers ?? []),
  ];
  if (["POST", "PUT", "PATCH"].includes(actionValue.method)) headers.push({ key: "Content-Type", value: "application/json" });
  return {
    name: extra.name ?? title(actionValue.name),
    event: [
      ...(extra.preRequest ? [{ listen: "prerequest", script: { type: "text/javascript", exec: extra.preRequest } }] : []),
      ...(extra.tests ? [{ listen: "test", script: { type: "text/javascript", exec: extra.tests } }] : []),
    ],
    request: {
      method: actionValue.method,
      header: headers,
      body: ["POST", "PUT", "PATCH"].includes(actionValue.method)
        ? { mode: "raw", raw: extra.body ?? "{}", options: { raw: { language: "json" } } }
        : undefined,
      url: `{{${domains[domain].baseVariable}}}${variablePath(actionValue.path)}${extra.query ?? ""}`,
      description: extra.description ?? `${actionValue.name} · ${actionValue.auth} · ${actionValue.idempotent ? "idempotent" : "mutation"}`,
    },
    response: [],
  };
}

const commonTests = [
  'pm.test("HTTP response received", function () { pm.expect(pm.response.code).to.be.within(200, 599); });',
  'pm.test("JSON content type for JSON responses", function () { if (pm.response.text()) pm.expect(pm.response.headers.get("Content-Type") || "").to.include("application/json"); });',
];

const specs = {
  schema: "powerchain-postman-specs/v1",
  version: "1.0.0",
  title: "PowerChain | DeFAI API Specs",
  generatedFrom: "shared/actions.json",
  security: { type: "apiKey", header: "X-Api-Key", variable: "apiKey" },
  domains,
  invariants: [
    "Wallet private keys and seed phrases never enter Postman variables.",
    "Mock responses are non-authoritative and never prove signing, execution, finality, or settlement.",
    "Bridge principal movement remains Wormhole NTT-only.",
    "Swap execution remains connected-wallet signed.",
    "Market, portfolio, worker, RPC, explorer, and mock data are not authoritative for Bridge accounting.",
  ],
  actions: actions.map((item) => ({
    name: item.name,
    method: item.method,
    path: item.path,
    domain: domainForPath(item.path),
    auth: item.auth,
    idempotent: item.idempotent,
  })),
};

const flowDefinitions = [
  {
    id: "platform-preflight",
    name: "Platform Preflight",
    purpose: "Validate public security, cluster, RPC and token-information readiness before transactional flows.",
    inputs: [],
    visualBlocks: ["Start", "HTTP Request", "Validate", "Condition", "Evaluate", "Display"],
    steps: [
      { method: "GET", path: "/api/v1/security/policy", stage: "Security policy" },
      { method: "GET", path: "/api/v1/clusters", stage: "Clusters" },
      { method: "GET", path: "/api/v1/rpc/status", stage: "RPC status" },
      { method: "GET", path: "/api/v1/token/information", stage: "Token information" },
    ],
  },
  {
    id: "sui-swap-review",
    name: "Sui Swap Review",
    purpose: "Balance preflight, quote and unsigned transaction preparation. Wallet signing and submission happen outside Postman.",
    inputs: ["suiWallet", "suiInputAsset", "suiInputCoinType", "suiOutputCoinType", "swapAmountBaseUnits", "slippageBps"],
    visualBlocks: ["Start", "HTTP Request", "Validate", "Condition", "Evaluate", "Display"],
    steps: [
      { method: "GET", path: "/api/v1/swap/balance", stage: "Balance", query: "?address={{suiWallet}}&asset={{suiInputAsset}}" },
      { method: "POST", path: "/api/v1/swap/quote", stage: "Quote", body: `{\n  "payer": "{{suiWallet}}",\n  "fromCoinType": "{{suiInputCoinType}}",\n  "toCoinType": "{{suiOutputCoinType}}",\n  "amountBaseUnits": "{{swapAmountBaseUnits}}",\n  "slippageBps": {{slippageBps}}\n}`, capture: { suiMinimumOutBaseUnits: "data.minimumOutBaseUnits", suiQuoteId: "data.quoteId" } },
      { method: "POST", path: "/api/v1/swap/transaction", stage: "Prepare unsigned transaction", body: `{\n  "payer": "{{suiWallet}}",\n  "fromCoinType": "{{suiInputCoinType}}",\n  "toCoinType": "{{suiOutputCoinType}}",\n  "amountBaseUnits": "{{swapAmountBaseUnits}}",\n  "slippageBps": {{slippageBps}},\n  "minimumOutBaseUnits": "{{suiMinimumOutBaseUnits}}"\n}` },
    ],
    securityBoundary: "The returned Sui transaction is unsigned. The connected wallet signs and submits it outside Postman.",
  },
  {
    id: "solana-swap-review",
    name: "Solana Swap Review",
    purpose: "Jupiter order preparation and signed-payload execution boundary. Postman never creates the wallet signature.",
    inputs: ["solanaWallet", "solanaInputMint", "solanaOutputMint", "swapAmountBaseUnits", "slippageBps", "signedTransaction"],
    visualBlocks: ["Start", "HTTP Request", "Validate", "Condition", "Evaluate", "Display"],
    steps: [
      { method: "POST", path: "/api/v1/swap/solana/order", stage: "Create Jupiter order", body: `{\n  "payer": "{{solanaWallet}}",\n  "inputMint": "{{solanaInputMint}}",\n  "outputMint": "{{solanaOutputMint}}",\n  "amountBaseUnits": "{{swapAmountBaseUnits}}",\n  "slippageBps": {{slippageBps}}\n}`, capture: { jupiterRequestId: "data.requestId", jupiterUnsignedTransaction: "data.transaction", jupiterMinimumOutputBaseUnits: "data.otherAmountThreshold", jupiterLastValidBlockHeight: "data.lastValidBlockHeight" } },
      { method: "POST", path: "/api/v1/swap/solana/execute", stage: "Execute wallet-signed payload", body: `{\n  "payer": "{{solanaWallet}}",\n  "signedTransaction": "{{signedTransaction}}",\n  "requestId": "{{jupiterRequestId}}",\n  "inputMint": "{{solanaInputMint}}",\n  "outputMint": "{{solanaOutputMint}}",\n  "amountBaseUnits": "{{swapAmountBaseUnits}}",\n  "slippageBps": {{slippageBps}},\n  "minimumOutputBaseUnits": "{{jupiterMinimumOutputBaseUnits}}"\n}` },
    ],
    securityBoundary: "Copy the unsigned transaction to the connected wallet, sign outside Postman, then provide only the signed serialized payload to the execute request.",
  },
  {
    id: "bridge-create-monitor",
    name: "Bridge Create & Monitor",
    purpose: "Read Bridge readiness/routes, issue a bound quote, create persisted transfer state, then inspect authoritative persisted status/events.",
    inputs: ["bridgeDirection", "bridgePrincipalBaseUnits", "bridgeSourceAddress", "bridgeDestinationAddress", "bridgeIdempotencyKey"],
    visualBlocks: ["Start", "HTTP Request", "Validate", "Condition", "Evaluate", "Delay", "Display"],
    steps: [
      { method: "GET", path: "/api/v1/bridge/runtime", stage: "Runtime" },
      { method: "GET", path: "/api/v1/bridge/routes", stage: "Routes" },
      { method: "POST", path: "/api/v1/bridge/quote", stage: "Quote", body: JSON.stringify({ direction: "{{bridgeDirection}}", principalBaseUnits: "{{bridgePrincipalBaseUnits}}", sourceAddress: "{{bridgeSourceAddress}}", destinationAddress: "{{bridgeDestinationAddress}}" }, null, 2), capture: { bridgeQuoteId: "data.quoteId", bridgeIntentCommitment: "data.intentCommitment", bridgeRuntimeSnapshotId: "data.runtimeSnapshotId" } },
      { method: "POST", path: "/api/v1/bridge/transfers", stage: "Create transfer", headers: [{ key: "Idempotency-Key", value: "{{bridgeIdempotencyKey}}" }], preRequest: ['if (!pm.collectionVariables.get("bridgeIdempotencyKey")) pm.collectionVariables.set("bridgeIdempotencyKey", pm.variables.replaceIn("{{$guid}}"));'], body: JSON.stringify({ quoteId: "{{bridgeQuoteId}}", intentCommitment: "{{bridgeIntentCommitment}}", runtimeSnapshotId: "{{bridgeRuntimeSnapshotId}}" }, null, 2), capture: { id: "data.id", transferId: "data.id" } },
      { method: "GET", path: "/api/v1/bridge/transfers/:id", stage: "Transfer status" },
      { method: "GET", path: "/api/v1/bridge/transfers/:id/events", stage: "Transfer events" },
    ],
    terminalStatuses: ["COMPLETED", "FAILED"],
    nonTerminalStatuses: ["CREATED", "SOURCE_SUBMITTING", "SOURCE_SUBMITTED", "SOURCE_FINALIZED", "MESSAGE_OBSERVED", "DESTINATION_SUBMITTED", "DESTINATION_FINALIZED", "RECONCILIATION_REQUIRED"],
    securityBoundary: "Postman observes API state only. Source wallet signing, destination finality and Wormhole NTT reconciliation remain external trust boundaries.",
  },
];

function captureTests(capture = {}) {
  const lines = [];
  for (const [variable, propertyPath] of Object.entries(capture)) {
    lines.push(`try { const body = pm.response.json(); const value = ${propertyPath.split('.').reduce((expr, part) => `${expr}?.[${JSON.stringify(part)}]`, 'body')}; if (value !== undefined && value !== null) pm.collectionVariables.set(${JSON.stringify(variable)}, String(value)); } catch (_) {}`);
  }
  return lines;
}

const flowManifest = {
  schema: "powerchain-postman-flows/v2",
  version: "1.0.0",
  title: "PowerChain | DeFAI API Flows",
  architecture: "docs/POSTMAN_FLOWS_ARCHITECTURE.md",
  masterFlow: {
    id: "powerchain-main-flow",
    name: "PowerChain DeFAI API — Main Flow",
    sequence: ["platform-preflight", "operation-condition", "sui-swap-review|solana-swap-review|bridge-create-monitor", "display-result"],
    note: "Use Platform Preflight first, then route to exactly one child flow. Visual Condition/Validate/Delay blocks are configured in Postman Flows from the same collection requests.",
  },
  note: "This manifest describes the visual Flow architecture and also generates a Collection Runner artifact. It is not presented as a native Postman Flows canvas export.",
  flows: flowDefinitions.map((flow) => ({
    id: flow.id,
    name: flow.name,
    purpose: flow.purpose,
    inputs: flow.inputs,
    visualBlocks: flow.visualBlocks,
    securityBoundary: flow.securityBoundary ?? null,
    terminalStatuses: flow.terminalStatuses ?? null,
    nonTerminalStatuses: flow.nonTerminalStatuses ?? null,
    steps: flow.steps.map((step, index) => {
      const item = action(step.method, step.path);
      if (!item) throw new Error(`Flow ${flow.id} references missing action ${step.method} ${step.path}`);
      return { order: index + 1, stage: step.stage, action: item.name, method: step.method, path: step.path, domain: domainForPath(step.path), query: step.query ?? null, requestBody: step.body ?? null, captures: step.capture ?? null };
    }),
  })),
};

function flowRequest(step) {
  const tests = [...commonTests, ...captureTests(step.capture)];
  return requestFor(action(step.method, step.path), {
    name: step.stage,
    query: step.query,
    body: step.body,
    tests,
    headers: step.headers,
    preRequest: step.preRequest,
    description: `${step.stage}. Wallet/signing/finality boundaries remain external unless the API contract explicitly reports otherwise.`,
  });
}

const flowVariables = [
  { key: "baseUrl", value: domains.shared.baseUrl, type: "string" },
  { key: "swapUrl", value: domains.swap.baseUrl, type: "string" },
  { key: "bridgeUrl", value: domains.bridge.baseUrl, type: "string" },
  { key: "apiKey", value: "", type: "string" },
  { key: "suiWallet", value: "", type: "string" },
  { key: "suiInputAsset", value: "wpwrc", type: "string" },
  { key: "suiInputCoinType", value: "", type: "string" },
  { key: "suiOutputCoinType", value: "0x2::sui::SUI", type: "string" },
  { key: "solanaWallet", value: "", type: "string" },
  { key: "solanaInputMint", value: "", type: "string" },
  { key: "solanaOutputMint", value: "", type: "string" },
  { key: "swapAmountBaseUnits", value: "1000000000", type: "string" },
  { key: "slippageBps", value: "50", type: "string" },
  { key: "suiMinimumOutBaseUnits", value: "", type: "string" },
  { key: "suiQuoteId", value: "", type: "string" },
  { key: "jupiterRequestId", value: "", type: "string" },
  { key: "jupiterUnsignedTransaction", value: "", type: "string" },
  { key: "jupiterMinimumOutputBaseUnits", value: "", type: "string" },
  { key: "jupiterLastValidBlockHeight", value: "", type: "string" },
  { key: "signedTransaction", value: "", type: "string" },
  { key: "bridgeDirection", value: "SUI_TO_SOLANA", type: "string" },
  { key: "bridgePrincipalBaseUnits", value: "1000000000", type: "string" },
  { key: "bridgeSourceAddress", value: "", type: "string" },
  { key: "bridgeDestinationAddress", value: "", type: "string" },
  { key: "bridgeQuoteId", value: "", type: "string" },
  { key: "bridgeIntentCommitment", value: "", type: "string" },
  { key: "bridgeRuntimeSnapshotId", value: "", type: "string" },
  { key: "bridgeIdempotencyKey", value: "", type: "string" },
  { key: "id", value: "replace-me", type: "string" },
  { key: "transferId", value: "replace-me", type: "string" },
];

const flowCollection = {
  info: {
    name: "PowerChain DeFAI API Flows 1.0.0",
    description: "Executable Collection Runner companion for the PowerChain Postman Flow architecture. Request bodies and variable capture are production-shaped; wallet signing stays outside Postman and Bridge finality remains Wormhole NTT-bound.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  variable: flowVariables,
  event: [{ listen: "test", script: { type: "text/javascript", exec: commonTests } }],
  item: flowDefinitions.map((flow) => ({
    name: flow.name,
    description: `${flow.purpose}${flow.securityBoundary ? ` SECURITY BOUNDARY: ${flow.securityBoundary}` : ""}`,
    item: flow.steps.map(flowRequest),
  })),
};

function jsonResponse(name, code, body) {
  return {
    name,
    originalRequest: { method: "GET", header: [], url: "{{mockUrl}}/" },
    status: code >= 400 ? "Error" : "OK",
    code,
    _postman_previewlanguage: "json",
    header: [{ key: "Content-Type", value: "application/json" }],
    cookie: [],
    body: JSON.stringify({ mock: true, authoritativeForBridgeAccounting: false, ...body }, null, 2),
  };
}

const mockDefinitions = [
  ["GET", "/api/v1/health", "Health — mock", 200, { service: "powerchain-defai", version: "1.0.0", status: "mock-ready" }],
  ["GET", "/api/v1/security/policy", "Security policy — mock", 200, { apiKey: { headerName: "X-Api-Key", mode: "optional", configured: true }, walletIdentityAuthority: false }],
  ["GET", "/api/v1/clusters", "Clusters — mock", 200, { active: { solana: "solana:mainnet", sui: "sui:mainnet" }, principalMovementProtocol: "wormhole-ntt" }],
  ["GET", "/api/v1/rpc/status", "RPC status — mock", 200, { status: "mock", activeClusters: { solana: "solana:mainnet", sui: "sui:mainnet" }, endpoints: [] }],
  ["GET", "/api/v1/bridge/runtime", "Bridge runtime — mock", 200, { status: "mock", defaultDirection: "SUI_TO_SOLANA", principalMovementProtocol: "wormhole-ntt", finalityVerified: false }],
  ["GET", "/api/v1/bridge/routes", "Bridge routes — mock", 200, { routes: [{ direction: "SUI_TO_SOLANA", source: "wPWRC", destination: "PWRC", principalRatio: "1:1", mock: true }] }],
  ["POST", "/api/v1/bridge/quote", "Bridge quote — mock", 200, { quoteId: "mock-bridge-quote", direction: "SUI_TO_SOLANA", principalBaseUnits: "1000000000", expiresAt: "2099-01-01T00:00:00.000Z", signed: false, finalized: false }],
  ["GET", "/api/v1/swap/balance", "Swap balance — mock", 200, { chain: "SUI", asset: "wPWRC", balanceBaseUnits: "10000000000", verified: false }],
  ["POST", "/api/v1/swap/quote", "Swap quote — mock", 200, { provider: "cetus", inputBaseUnits: "1000000000", outputBaseUnits: "975000000", minimumOutBaseUnits: "970125000", feeBps: 250, expiresAt: "2099-01-01T00:00:00.000Z", signed: false }],
  ["POST", "/api/v1/swap/solana/order", "Solana order — mock", 200, { provider: "jupiter", orderId: "mock-order", transaction: "mock-unsigned-transaction", walletSignatureRequired: true, executed: false }],
];

const mockItems = mockDefinitions.map(([method, pathValue, name, code, body]) => {
  const itemAction = action(method, pathValue);
  if (!itemAction) throw new Error(`Mock references missing action ${method} ${pathValue}`);
  const domain = domainForPath(pathValue);
  const item = requestFor(itemAction, { name });
  item.request.url = `{{mockUrl}}${variablePath(pathValue)}`;
  const response = jsonResponse(name, code, body);
  response.originalRequest = JSON.parse(JSON.stringify(item.request));
  item.response = [response];
  return item;
});

const mockCollection = {
  info: {
    name: "PowerChain DeFAI API Mocks 1.0.0",
    description: "Saved response examples for Postman mock servers. Every example is explicitly mock/non-authoritative and cannot prove signing, execution, finality, settlement, balances, or market truth.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  variable: [
    { key: "mockUrl", value: "https://example.mock.pstmn.io", type: "string" },
    { key: "apiKey", value: "", type: "string" },
    { key: "id", value: "mock-transfer-id", type: "string" },
  ],
  item: mockItems,
};

const specsReadme = `# PowerChain | DeFAI Postman Specs\n\nGenerated API-spec inventory for Postman tooling. The canonical schema contracts remain \`api/swagger.yaml\`, \`api/bridge/openapi.yaml\`, and \`api/swap/openapi.yaml\`.\n\n- \`PowerChain-DeFAI.postman_specs.json\` binds all generated actions to their domain, method, path, authentication mode and idempotency.\n- API-key authentication uses \`X-Api-Key\`.\n- Bridge, Swap and shared API hosts stay separated.\n- Wallet secrets and signing material must never be stored in Postman variables.\n\nRegenerate with \`pnpm postman:generate\` and verify with \`pnpm postman:check\`.\n`;

const flowsReadme = `# PowerChain | DeFAI Postman Flows\n\nThe checked-in flow artifacts are executable **Collection Runner companions** generated from the canonical API action registry. The detailed visual canvas design lives in [../../../docs/POSTMAN_FLOWS_ARCHITECTURE.md](../../../docs/POSTMAN_FLOWS_ARCHITECTURE.md).\n\nIncluded flows:\n\n1. Platform Preflight\n2. Sui Swap Review\n3. Solana Swap Review\n4. Bridge Create & Monitor\n\nThe generated requests use real Start-input mappings and production-shaped request bodies. Quote/order responses capture the values needed by later requests. Wallet signatures still happen outside Postman.\n\n\`PowerChain-DeFAI.flows.json\` is the declarative architecture manifest, including visual block types and typed inputs. \`PowerChain-DeFAI.flows.postman_collection.json\` is the importable Collection Runner companion. It is intentionally not presented as a native Postman Flows canvas export.\n\nBridge monitoring uses the API's canonical statuses. The visual Flow may add a Delay block between status checks; the checked-in Runner companion remains bounded rather than creating an unbounded polling loop.\n`;

const mocksReadme = `# PowerChain | DeFAI Postman Mocks\n\nImport \`PowerChain-DeFAI.mocks.postman_collection.json\` and create a Postman mock server from the collection. Postman mock servers use saved response examples from a collection.\n\nSet the collection variable \`mockUrl\` to the URL Postman assigns to the mock server.\n\nAll examples contain \`mock: true\` and \`authoritativeForBridgeAccounting: false\`. They are interface fixtures only and never represent real balances, quotes, signatures, execution, finality, market prices, or Wormhole NTT reconciliation.\n`;

const files = [
  [path.join(specsDir, "PowerChain-DeFAI.postman_specs.json"), `${JSON.stringify(specs, null, 2)}\n`],
  [path.join(specsDir, "README.md"), specsReadme],
  [path.join(flowsDir, "PowerChain-DeFAI.flows.json"), `${JSON.stringify(flowManifest, null, 2)}\n`],
  [path.join(flowsDir, "PowerChain-DeFAI.flows.postman_collection.json"), `${JSON.stringify(flowCollection, null, 2)}\n`],
  [path.join(flowsDir, "README.md"), flowsReadme],
  [path.join(mocksDir, "PowerChain-DeFAI.mocks.postman_collection.json"), `${JSON.stringify(mockCollection, null, 2)}\n`],
  [path.join(mocksDir, "README.md"), mocksReadme],
];

if (check) {
  let ok = true;
  for (const [file, expected] of files) {
    if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== expected) {
      console.error(`Stale Postman specs/flows/mocks artifact: ${path.relative(root, file)}`);
      ok = false;
    }
  }
  if (!ok) process.exit(1);
  console.log(`Postman specs/flows/mocks current (${actions.length} actions, ${flowDefinitions.length} flows, ${mockDefinitions.length} mock examples)`);
} else {
  for (const directory of [specsDir, flowsDir, mocksDir]) fs.mkdirSync(directory, { recursive: true });
  for (const [file, value] of files) fs.writeFileSync(file, value);
  console.log(`Generated Postman specs/flows/mocks (${actions.length} actions, ${flowDefinitions.length} flows, ${mockDefinitions.length} mock examples)`);
}
