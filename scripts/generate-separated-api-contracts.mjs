import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const check = process.argv.includes("--check");
const registry = JSON.parse(fs.readFileSync(path.join(root, "shared/actions.json"), "utf8"));
const actions = registry.actions;

const title = (value) => value.split(/[._-]/).filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
const normalizePath = (value) => value.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
const operationId = (action) => action.name.replace(/[^A-Za-z0-9_.-]/g, "-");
const subset = (kind) => actions.filter((action) => action.path.startsWith(`/api/v1/${kind}/`));

function yamlString(value) {
  return JSON.stringify(String(value));
}

function pathParameters(routePath) {
  return [...routePath.matchAll(/:([A-Za-z0-9_]+)/g)].map((match) => match[1]);
}

function openapi({ kind = null, items, serverUrl, titleText, description }) {
  const tag = kind ? kind[0].toUpperCase() + kind.slice(1) : "DeFAI";
  const groups = new Map();
  for (const action of items) {
    const routePath = action.path;
    const group = groups.get(routePath) ?? [];
    group.push(action);
    groups.set(routePath, group);
  }
  const lines = [
    "openapi: 3.1.0",
    "info:",
    `  title: ${titleText}`,
    `  version: ${registry.version ?? "1.0.0"}`,
    `  description: ${yamlString(description)}`,
    "servers:",
    `  - url: ${serverUrl}`,
    "security:",
    "  - ApiKey: []",
    `x-powerchain-route-count: ${groups.size}`,
    `x-powerchain-action-count: ${items.length}`,
    "paths:",
  ];

  for (const [rawPath, routeActions] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const routePath = normalizePath(rawPath);
    lines.push(`  ${routePath}:`);
    const parameters = pathParameters(rawPath);
    if (parameters.length) {
      lines.push("    parameters:");
      for (const parameter of parameters) {
        lines.push(`      - name: ${parameter}`);
        lines.push("        in: path");
        lines.push("        required: true");
        lines.push("        schema: { type: string, minLength: 1, maxLength: 256 }");
      }
    }
    for (const action of [...routeActions].sort((a, b) => a.method.localeCompare(b.method))) {
      lines.push(`    ${action.method.toLowerCase()}:`);
      lines.push(`      operationId: ${operationId(action)}`);
      lines.push(`      tags: [${tag}]`);
      lines.push(`      summary: ${title(action.name)}`);
      lines.push(`      x-powerchain-auth: ${action.auth ?? "public"}`);
      lines.push(`      x-powerchain-idempotent: ${Boolean(action.idempotent)}`);
      lines.push("      responses:");
      lines.push('        "200": { description: "PowerChain API response" }');
      lines.push('        "400": { $ref: "#/components/responses/BadRequest" }');
      lines.push('        "401": { $ref: "#/components/responses/Unauthorized" }');
      lines.push('        "429": { $ref: "#/components/responses/RateLimited" }');
      lines.push('        "500": { $ref: "#/components/responses/InternalError" }');
    }
  }

  lines.push(
    "components:",
    "  securitySchemes:",
    "    ApiKey:",
    "      type: apiKey",
    "      in: header",
    "      name: X-Api-Key",
    "      description: Runtime enforcement is controlled by POWERCHAIN_API_KEY_MODE.",
    "  schemas:",
    "    ErrorResponse:",
    "      type: object",
    "      required: [error]",
    "      properties:",
    "        error: { type: string }",
    "        code: { type: string }",
    "        requestId: { type: string }",
    "  responses:",
    "    BadRequest:",
    "      description: Request validation failed",
    "      content:",
    "        application/json:",
    "          schema: { $ref: \"#/components/schemas/ErrorResponse\" }",
    "    Unauthorized:",
    "      description: API authentication failed",
    "      content:",
    "        application/json:",
    "          schema: { $ref: \"#/components/schemas/ErrorResponse\" }",
    "    RateLimited:",
    "      description: Request rate limit exceeded",
    "      content:",
    "        application/json:",
    "          schema: { $ref: \"#/components/schemas/ErrorResponse\" }",
    "    InternalError:",
    "      description: Internal request failure",
    "      content:",
    "        application/json:",
    "          schema: { $ref: \"#/components/schemas/ErrorResponse\" }",
  );
  return `${lines.join("\n")}\n`;
}

function collection(kind, items) {
  const cap = kind[0].toUpperCase() + kind.slice(1);
  const baseUrl = kind === "bridge" ? "https://bridge.powerchain.app" : "https://swap.powerchain.app";
  return {
    info: {
      name: `PowerChain ${cap} API 1.0.0`,
      description: `Generated ${kind}-only collection from shared/actions.json. See api/postman/API_DOCS.md for authentication, environments and the shared API inventory.`,
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    variable: [
      { key: "baseUrl", value: baseUrl, type: "string" },
      { key: "apiRoot", value: "https://powerchain.app", type: "string" },
      { key: "id", value: "replace-me", type: "string" },
      { key: "apiKey", value: "", type: "string" },
    ],
    item: items.map((action) => ({
      name: title(action.name),
      request: {
        method: action.method,
        header: [
          { key: "Accept", value: "application/json" },
          { key: "X-Api-Key", value: "{{apiKey}}", type: "text" },
          ...(["POST", "PUT", "PATCH"].includes(action.method) ? [{ key: "Content-Type", value: "application/json" }] : []),
        ],
        url: `{{baseUrl}}${action.path.replace(/:([A-Za-z0-9_]+)/g, "{{$1}}")}`,
        ...(["POST", "PUT", "PATCH"].includes(action.method) ? { body: { mode: "raw", raw: "{}", options: { raw: { language: "json" } } } } : {}),
      },
      response: [],
    })),
  };
}

const bridgeItems = subset("bridge");
const swapItems = subset("swap");
const outputs = [
  ["api/swagger.yaml", openapi({ items: actions, serverUrl: "https://powerchain.app", titleText: "PowerChain DeFAI API", description: "Generated complete API contract from the canonical filesystem route registry. AI is advisory-only; wallet signatures remain user-authorized and Wormhole NTT remains the cross-chain principal-movement protocol." })],
  ["api/bridge/openapi.yaml", openapi({ kind: "bridge", items: bridgeItems, serverUrl: "/", titleText: "PowerChain Bridge API", description: "Bridge-only contract; Wormhole NTT remains the sole cross-chain principal-movement protocol." })],
  ["api/swap/openapi.yaml", openapi({ kind: "swap", items: swapItems, serverUrl: "/", titleText: "PowerChain Swap API", description: "Swap-only contract for wallet-owned Solana Jupiter and Sui Cetus-adapter execution." })],
  ["api/bridge/postman/PowerChain-Bridge.postman_collection.json", `${JSON.stringify(collection("bridge", bridgeItems), null, 2)}\n`],
  ["api/swap/postman/PowerChain-Swap.postman_collection.json", `${JSON.stringify(collection("swap", swapItems), null, 2)}\n`],
];

let ok = true;
for (const [relative, value] of outputs) {
  const file = path.join(root, relative);
  if (check) {
    if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== value) {
      console.error(`Stale API artifact: ${relative}`);
      ok = false;
    }
  } else {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, value);
  }
}
if (!ok) process.exit(1);
console.log(`${check ? "API contracts current" : "Generated API contracts"}: total=${actions.length}, bridge=${bridgeItems.length}, swap=${swapItems.length}`);
