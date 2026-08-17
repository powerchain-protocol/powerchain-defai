import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
const must = (condition, message) => { if (!condition) throw new Error(message); };

const rootPackage = readJson("package.json");
for (const [name, version] of Object.entries({
  react: "19.2.8",
  "react-dom": "19.2.8",
  "@types/react": "19.2.18",
  "@types/react-dom": "19.2.4",
})) {
  must(rootPackage.devDependencies?.[name] === version, `ROOT_REACT_TYPE_DEPENDENCY_MISSING:${name}`);
}

for (const rel of ["apps/bridge/package.json", "apps/chat/package.json"]) {
  const pkg = readJson(rel);
  must(pkg.dependencies?.react === "19.2.8", `REACT_RUNTIME_DEPENDENCY_MISSING:${rel}`);
  must(pkg.devDependencies?.["@types/react"] === "19.2.18", `REACT_TYPES_DEPENDENCY_MISSING:${rel}`);
}

const bridgeTs = readJson("apps/bridge/tsconfig.json");
must(bridgeTs.compilerOptions?.types?.includes("react"), "BRIDGE_REACT_TYPES_NOT_DECLARED");
const chatTs = readJson("apps/chat/tsconfig.json");
must(chatTs.compilerOptions?.jsx === "react-jsx", "CHAT_REACT_JSX_MODE_INVALID");
must(chatTs.compilerOptions?.noEmit === true, "CHAT_NO_EMIT_REQUIRED");
must(Array.isArray(chatTs.compilerOptions?.types) && chatTs.compilerOptions.types.length === 0, "CHAT_AMBIENT_TYPES_MUST_BE_EMPTY");

const stale = path.join(root, "apps/bridge/tsconfig.tsbuildinfo");
must(!fs.existsSync(stale), "STALE_TSC_BUILDINFO_PACKAGED");
const gitignore = fs.readFileSync(path.join(root, ".gitignore"), "utf8");
must(gitignore.includes("*.tsbuildinfo"), "TSC_BUILDINFO_NOT_IGNORED");

console.log("React/TypeScript type resolution production check: PASS");
