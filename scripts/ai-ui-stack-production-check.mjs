import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const json = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const failures = [];
const must = (condition, message) => { if (!condition) failures.push(message); };

const rootPackage = json("package.json");
const bridge = json("apps/bridge/package.json");
const chat = json("apps/chat/package.json");
const backend = json("apps/backend/package.json");
const staking = json("apps/staking/package.json");

for (const [name, version] of Object.entries({
  react: "19.2.8",
  "react-dom": "19.2.8",
  "@types/react": "19.2.18",
  "@types/react-dom": "19.2.4",
})) must(rootPackage.devDependencies?.[name] === version, `root ${name} must be ${version}`);

must(bridge.dependencies?.react === "19.2.8", "Bridge React must be 19.2.8");
must(bridge.dependencies?.["react-dom"] === "19.2.8", "Bridge React DOM must be 19.2.8");
must(bridge.devDependencies?.["@types/react"] === "19.2.18", "Bridge React types must be 19.2.18");
must(bridge.devDependencies?.["@types/react-dom"] === "19.2.4", "Bridge React DOM types must be 19.2.4");
must(bridge.dependencies?.["@radix-ui/react-icons"] === "1.3.2", "Bridge Radix icons must be 1.3.2");
must(fs.existsSync(path.join(root, "apps/bridge/components/icons.tsx")), "Bridge centralized icons.tsx is required");

must(chat.dependencies?.react === "19.2.8", "Chat React must be 19.2.8");
must(chat.devDependencies?.["@types/react"] === "19.2.18", "Chat React types must be 19.2.18");
must(chat.dependencies?.ai === "7.0.66", "Chat AI SDK must be 7.0.66");
must(chat.dependencies?.["@radix-ui/react-icons"] === "1.3.2", "Chat Radix icons must be 1.3.2");
must(fs.existsSync(path.join(root, "apps/chat/src/ai/providers.ts")), "Chat AI provider registry is required");
must(read("apps/chat/src/ai/messages.ts").includes('from "ai"'), "Chat message contract must use the AI SDK UIMessage type");

must(backend.dependencies?.openai === "7.4.0", "Backend OpenAI SDK must be 7.4.0");
must(backend.dependencies?.["@google/genai"] === "2.17.0", "Backend Google GenAI SDK must be 2.17.0");
must(read("apps/backend/src/services/ai/provider-clients.ts").includes('from "openai"'), "Backend must use official OpenAI SDK");
must(read("apps/backend/src/services/ai/provider-clients.ts").includes('from "@google/genai"'), "Backend must use official Google GenAI SDK");
must(read("apps/backend/src/services/ai/provider-clients.ts").includes('baseURL: process.env.DEEPSEEK_BASE_URL'), "DeepSeek must use the OpenAI-compatible backend client");

for (const key of ["POWERCHAIN_AI_PROVIDER=auto", "OPENAI_API_KEY=", "DEEPSEEK_API_KEY=", "GOOGLE_GENAI_API_KEY="]) {
  must(read(".env.example").includes(key), `root env schema missing ${key}`);
}
must(!read(".env.example").includes("NEXT_PUBLIC_OPENAI_API_KEY"), "AI provider keys must not be public env vars");

must(staking.dependencies?.["@powerchain/blockchain"] === "workspace:*", "Staking must depend on shared blockchain primitives");
must(staking.dependencies?.["@powerchain/runtime"] === "workspace:*", "Staking must depend on runtime policy");
must(staking.dependencies?.["@mysten/sui"] === "2.26.1", "Staking Sui SDK must match 2.26.1");
must(staking.dependencies?.["@solana/kit"] === "7.1.0", "Staking Solana Kit must match 7.1.0");

must(!fs.existsSync(path.join(root, "INSTALLATION.md")), "INSTALLATION.md must be removed; root README is canonical");
const forbidden = ["powerchain", "bridge"].join("-");
for (const rel of ["README.md", "CHANGELOG.md", "docs/BUILD_RECOVERY.md", "scripts/setup-local.sh"]) {
  must(!read(rel).toLowerCase().includes(forbidden), `${rel} contains obsolete repository name`);
}

if (failures.length) {
  for (const failure of failures) console.error(`[ai-ui-stack] ${failure}`);
  process.exit(1);
}
console.log("AI_UI_STACK_PRODUCTION_CHECK_PASS react=19.2.8 ai=7.0.66 openai=7.4.0 google-genai=2.17.0 radix=1.3.2");
