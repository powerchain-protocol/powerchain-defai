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
const combinedCollection = readJson("api/postman/PowerChain-DeFAI.postman_collection.json");
const methodsCollection = readJson("api/postman/PowerChain-DeFAI.methods.postman_collection.json");
const localEnvironment = readJson("api/postman/PowerChain-DeFAI.local.postman_environment.json");
const productionEnvironment = readJson("api/postman/PowerChain-DeFAI.production.postman_environment.json");
const workspaceConfig = readJson("api/postman/PowerChain-DeFAI.workspace.json");
const datasetCsvPath = path.join(root, "api/postman/datasets/PowerChain-DeFAI.dataset.csv");
const datasetCsv = fs.readFileSync(datasetCsvPath, "utf8");
function parseCsv(text) {
  const rows = []; let row = []; let cell = ""; let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ""; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, "")); if (row.some((value) => value !== "")) rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [headers = [], ...data] = rows;
  return data.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}
const datasetRows = parseCsv(datasetCsv);

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
const methodFolderCounts = Object.fromEntries((methodsCollection.item ?? []).map((folder) => [folder.name, folder.item?.length ?? 0]));
const expectedMethodCounts = actions.reduce((acc, action) => { acc[action.method] = (acc[action.method] ?? 0) + 1; return acc; }, {});
must(methodsCollection.info?.schema?.includes("collection/v2.1.0"), "Method-oriented Postman collection must be importable Collection v2.1");
for (const [method, count] of Object.entries(expectedMethodCounts)) {
  must(methodFolderCounts[method] === count, `Method collection ${method} folder must contain ${count} canonical actions`);
}
for (const folder of methodsCollection.item ?? []) {
  for (const item of folder.item ?? []) {
    must(Array.isArray(item.response) && item.response.length > 0, `Method collection request ${item.name} must contain a saved response example`);
    for (const response of item.response ?? []) {
      const body = JSON.parse(response.body);
      must(body.example === true && body.authoritative === false, `Method response ${response.name} must be explicitly illustrative and non-authoritative`);
    }
  }
}
const collectionVariableKeys = (combinedCollection.variable ?? []).map((item) => item.key).sort();
const localVariableKeys = (localEnvironment.values ?? []).map((item) => item.key).sort();
const productionVariableKeys = (productionEnvironment.values ?? []).map((item) => item.key).sort();
must(JSON.stringify(localVariableKeys) === JSON.stringify(collectionVariableKeys), "Local Postman environment must expose the full collection-variable surface");
must(JSON.stringify(productionVariableKeys) === JSON.stringify(collectionVariableKeys), "Production Postman environment must expose the full collection-variable surface");
const localValues = Object.fromEntries((localEnvironment.values ?? []).map((item) => [item.key, item.value]));
must(localValues.baseUrl === "http://localhost:3000", "Local Postman baseUrl must stay localhost");
must(localValues.swapUrl === "http://localhost:3000", "Local Postman swapUrl must not fall back to production");
must(localValues.bridgeUrl === "http://localhost:3000", "Local Postman bridgeUrl must not fall back to production");
const productionValues = Object.fromEntries((productionEnvironment.values ?? []).map((item) => [item.key, item.value]));
must(productionValues.baseUrl === "https://powerchain.app", "Production Postman baseUrl drift");
must(productionValues.swapUrl === "https://swap.powerchain.app", "Production Postman swapUrl drift");
must(productionValues.bridgeUrl === "https://bridge.powerchain.app", "Production Postman bridgeUrl drift");
must(datasetRows.length >= 5, "Postman CSV dataset must contain at least five scenarios");
must(datasetRows.every((row) => row.apiKey === ""), "Source-controlled Postman CSV dataset must not contain API keys");
must(datasetRows.every((row) => typeof row.scenario === "string" && row.scenario.length > 0), "Every Postman CSV dataset row must have a scenario");
must(workspaceConfig.schema === "powerchain-postman-workspace/v1", "Postman workspace metadata schema missing");
must(workspaceConfig.workspaceId === "55a50a8b-cdb7-46f5-807e-3494d0262565", "Postman workspace ID drift");
must(workspaceConfig.specificationId === "1afb4b8d-159d-4f42-8805-f1f1a5143539", "Postman specification ID drift");
must(workspaceConfig.fileId === "04e6ee61-ea2e-4c44-83c6-51471951a035", "Postman specification file ID drift");
must(fs.existsSync(path.join(root, "api/postman/datasets/PowerChain-DeFAI.dataset.csv")), "Postman CSV dataset missing");

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
must(docs.includes("PowerChain-DeFAI.methods.postman_collection.json"), "Postman API Docs must link the method-oriented collection");
must(docs.includes("datasets/PowerChain-DeFAI.dataset.csv"), "Postman API Docs must document dataset sources");
must(docs.includes("crimson-crescent-8585.postman.co/workspace/55a50a8b-cdb7-46f5-807e-3494d0262565"), "Postman API Docs must retain the configured workspace specification reference");

if (errors.length) {
  for (const error of errors) console.error(error);
  process.exit(1);
}
console.log(`Postman lifecycle production check: PASS — ${specs.actions.length} specs / ${flows.flows.length} flows / ${mocks.item.length} mocks / ${datasetRows.length} CSV dataset rows / ${Object.keys(expectedMethodCounts).length} method folders`);
