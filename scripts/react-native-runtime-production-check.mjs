import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const workspace = fs.readFileSync(path.join(root, "pnpm-workspace.yaml"), "utf8");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const failures = [];
const must = (condition, message) => { if (!condition) failures.push(message); };

must(pkg.engines?.node === ">=24 <26", "package engine must remain >=24 <26");
must(pkg.devEngines?.runtime?.name === "node", "pnpm managed runtime must be Node");
must(pkg.devEngines?.runtime?.version === "24.19.0", "managed runtime must pin Node 24.19.0 exactly");
must(pkg.devEngines?.runtime?.onFail === "download", "managed runtime mismatch must download Node");
must(workspace.includes("runtimeOnFail: download"), "pnpm workspace must force runtime download on mismatch");
must(read(".nvmrc").trim() === "24.19.0", ".nvmrc must pin Node 24.19.0");
must(read(".node-version").trim() === "24.19.0", ".node-version must pin Node 24.19.0");
must(read("README.md").includes("Node 24.19.0"), "README must explain the managed Node 24.19.0 runtime");

if (failures.length) {
  for (const failure of failures) console.error(`[react-native-runtime] ${failure}`);
  process.exit(1);
}
console.log("React Native runtime production check: PASS — pnpm-managed Node 24.19.0 prevents Node 24.0.0 engine failures while package engines remain >=24 <26");
