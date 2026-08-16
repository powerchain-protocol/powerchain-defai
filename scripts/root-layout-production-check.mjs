import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const must=(ok,msg)=>{if(!ok)throw new Error(msg)};
for(const rel of [
  "api/package.json","api/README.md","api/swagger.yaml",
  "api/postman/PowerChain-DeFAI.postman_collection.json",
  "api/postman/PowerChain-DeFAI.local.postman_environment.json",
  "tokens/metadata/pwrc.json","tokens/metadata/wpwrc.json","tokens/metadata/providers.json",
  ".gitignore",".npmignore",".vercelignore"
]) must(fs.existsSync(path.join(root,rel)),`ROOT_LAYOUT_MISSING:${rel}`);
for(const rel of ["postman","metadata","swagger.yaml"]) must(!fs.existsSync(path.join(root,rel)),`LEGACY_ROOT_LAYOUT_FORBIDDEN:${rel}`);
const workspace=fs.readFileSync(path.join(root,"pnpm-workspace.yaml"),"utf8");
must(workspace.includes('- "api"'),"ROOT_API_WORKSPACE_MISSING");
const manifest=JSON.parse(fs.readFileSync(path.join(root,"build-manifest.json"),"utf8"));
const paths=new Set(manifest.artifacts.map((a)=>a.path));
for(const rel of ["api/swagger.yaml","tokens/metadata/pwrc.json","tokens/metadata/wpwrc.json"]){must(paths.has(rel),`BUILD_MANIFEST_LAYOUT_BINDING_MISSING:${rel}`)}
console.log("Root API/token layout production check: PASS");
