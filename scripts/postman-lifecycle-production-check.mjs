import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];
const must = (condition, message) => { if (!condition) errors.push(message); };
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));

const specs = readJson("api/postman/specs/PowerChain-DeFAI.postman_specs.json");
const flows = readJson("api/postman/flows/PowerChain-DeFAI.flows.json");
const flowCollection = readJson("api/postman/flows/PowerChain-DeFAI.flows.postman_collection.json");
const mocks = readJson("api/postman/mocks/PowerChain-DeFAI.mocks.postman_collection.json");
const actions = readJson("shared/actions.json").actions;

must(specs.schema === "powerchain-postman-specs/v1", "Postman specs schema missing");
must(specs.actions.length === actions.length, "Postman specs action count must match canonical registry");
must(specs.security?.header === "X-Api-Key", "Postman specs must bind X-Api-Key security");
must(specs.actions.some((item) => item.domain === "bridge") && specs.actions.some((item) => item.domain === "swap"), "Postman specs must separate Bridge and Swap domains");
must(Array.isArray(flows.flows) && flows.flows.length >= 4, "Expected at least four generated Postman flows");

must(flows.schema === "powerchain-postman-flows/v2", "Postman flow manifest must use the v2 architecture schema");
must(flows.architecture === "docs/POSTMAN_FLOWS_ARCHITECTURE.md", "Postman flow manifest must bind the architecture document");
must(flows.masterFlow?.id === "powerchain-main-flow", "Postman master flow definition missing");
must(specs.domains?.bridge?.baseUrl === "https://bridge.powerchain.app", "Bridge Postman domain must use bridge.powerchain.app");
for (const flow of flows.flows ?? []) {
  must(Array.isArray(flow.visualBlocks) && flow.visualBlocks.includes("HTTP Request"), `Flow ${flow.id} must declare visual HTTP Request blocks`);
}
const suiFlow = flows.flows.find((flow) => flow.id === "sui-swap-review");
must(suiFlow?.steps?.some((step) => typeof step.requestBody === "string" && step.requestBody.includes("\"minimumOutBaseUnits\": \"{{suiMinimumOutBaseUnits}}\"")), "Sui Swap flow must map minimumOutBaseUnits from the captured quote");
const solanaFlow = flows.flows.find((flow) => flow.id === "solana-swap-review");
must(solanaFlow?.steps?.some((step) => typeof step.requestBody === "string" && step.requestBody.includes("\"signedTransaction\": \"{{signedTransaction}}\"")), "Solana Swap flow must expose the external signedTransaction boundary");
const bridgeFlow = flows.flows.find((flow) => flow.id === "bridge-create-monitor");
must(Array.isArray(bridgeFlow?.terminalStatuses) && bridgeFlow.terminalStatuses.includes("COMPLETED") && bridgeFlow.terminalStatuses.includes("FAILED"), "Bridge flow terminal statuses must come from the canonical API model");
for (const id of ["platform-preflight", "sui-swap-review", "solana-swap-review", "bridge-create-monitor"]) {
  must(flows.flows.some((flow) => flow.id === id), `Missing Postman flow: ${id}`);
}
must(flowCollection.info?.schema?.includes("collection/v2.1.0"), "Flow collection must be importable Postman Collection v2.1");
must(Array.isArray(flowCollection.event) && JSON.stringify(flowCollection.event).includes("pm.test"), "Flow collection must include executable response tests");
must(mocks.info?.schema?.includes("collection/v2.1.0"), "Mock collection must be importable Postman Collection v2.1");
must(mocks.item.length >= 10, "Expected at least ten safe mock examples");
for (const item of mocks.item) {
  must(Array.isArray(item.response) && item.response.length > 0, `Mock request ${item.name} must contain saved response examples`);
  for (const response of item.response ?? []) {
    const body = JSON.parse(response.body);
    must(body.mock === true, `Mock response ${response.name} must declare mock:true`);
    must(body.authoritativeForBridgeAccounting === false, `Mock response ${response.name} must be non-authoritative for Bridge accounting`);
  }
}
const combinedCollection = readJson("api/postman/PowerChain-DeFAI.postman_collection.json");
const combinedItems = (combinedCollection.item ?? []).flatMap((folder) => folder.item ?? []);
for (const fragment of ["/api/v1/swap/quote", "/api/v1/swap/transaction", "/api/v1/swap/solana/order", "/api/v1/swap/solana/execute", "/api/v1/bridge/quote", "/api/v1/bridge/transfers"]) {
  const item = combinedItems.find((candidate) => String(candidate.request?.url ?? "").includes(fragment));
  must(item && item.request?.body?.raw && item.request.body.raw.trim() !== "{}", `Combined Postman request ${fragment} must use a production-shaped body template`);
}
const docs = fs.readFileSync(path.join(root, "api/postman/API_DOCS.md"), "utf8");
const flowArchitecture = fs.readFileSync(path.join(root, "docs/POSTMAN_FLOWS_ARCHITECTURE.md"), "utf8");
must(flowArchitecture.includes("PowerChain DeFAI Postman Flows Architecture"), "Postman Flow architecture document missing");
must(flowArchitecture.includes("https://bridge.powerchain.app"), "Postman Flow architecture must use the corrected Bridge host");
must(flowArchitecture.includes("SECURITY BOUNDARY"), "Postman Flow architecture must document the wallet-signing boundary");
must(!flowArchitecture.includes("bridge.powercain.app"), "Postman Flow architecture contains the old misspelled Bridge host");
must(docs.includes("## Specs, flows and mocks"), "Postman API Docs must document specs, flows and mocks");
must(docs.includes("PowerChain-DeFAI.flows.postman_collection.json"), "Postman API Docs must link the Runner flows collection");
must(docs.includes("PowerChain-DeFAI.mocks.postman_collection.json"), "Postman API Docs must link the mocks collection");

if (errors.length) {
  for (const error of errors) console.error(error);
  process.exit(1);
}
console.log(`Postman lifecycle production check: PASS — ${specs.actions.length} specs / ${flows.flows.length} flows / ${mocks.item.length} mocks`);
