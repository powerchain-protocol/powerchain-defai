import fs from "node:fs";

const read=(file)=>fs.readFileSync(file,"utf8");
const failures=[];
const must=(condition,message)=>{if(!condition)failures.push(message);};
const bootstrap=read("scripts/bootstrap-toolchain.sh");
const rootBootstrap=read("bootstrap.sh");
const runtime=read("scripts/activate-runtime.sh");
const wrapper=read("pnpmw");
const compose=read("scripts/compose-dev.sh");
const tasks=JSON.parse(read(".vscode/tasks.json"));
const pkg=JSON.parse(read("package.json"));

must(bootstrap.includes('POWERCHAIN_NODE_VERSION="24.19.0"'),"toolchain bootstrap must pin Node 24.19.0");
must(bootstrap.includes('POWERCHAIN_PNPM_VERSION="11.22.0"'),"toolchain bootstrap must pin pnpm 11.22.0");
must(bootstrap.includes('https://nodejs.org/dist/v${POWERCHAIN_NODE_VERSION}'),"toolchain bootstrap must download Node only from nodejs.org");
must(bootstrap.includes('SHASUMS256.txt') && bootstrap.includes('pc_sha256'),"downloaded Node runtime must be checksum verified");
must(bootstrap.includes('npm install --global --prefix "$pnpm_prefix"'),"pnpm bootstrap must use a user-local prefix");
must(!bootstrap.includes('corepack ') && !bootstrap.includes('nvm install') && !bootstrap.includes('nvm use'),"bootstrap must not require Corepack or nvm");
must(rootBootstrap.includes('source "$ROOT/scripts/bootstrap-toolchain.sh"'),"root bootstrap must source toolchain into current shell");

must(bootstrap.includes('pc_bootstrap_main') && bootstrap.includes('return "$pc_status"'),"sourced bootstrap failures must propagate instead of falling through");
must(bootstrap.includes('export PATH="$POWERCHAIN_NODE_HOME/bin:$PATH"') && bootstrap.indexOf('export PATH="$POWERCHAIN_NODE_HOME/bin:$PATH"') < bootstrap.indexOf('npm install --global --prefix "$pnpm_prefix"'),"Node bin must be exported before npm installs pnpm");
must(bootstrap.includes('Removing incomplete local Node installation'),"partial local Node installations must be detected and repaired");
must(rootBootstrap.includes('|| return $?'),"root bootstrap must propagate toolchain bootstrap failure");
must(wrapper.includes('|| exit $?'),"pnpmw must stop when toolchain bootstrap fails");
must(rootBootstrap.includes('must be sourced'),"root bootstrap must reject misleading child-shell execution");
must(runtime.includes('source "$SCRIPT_DIR/bootstrap-toolchain.sh"'),"legacy runtime activator must delegate to toolchain bootstrap");
must(wrapper.includes('source "$ROOT/scripts/bootstrap-toolchain.sh"') && wrapper.includes('exec pnpm "$@"'),"pnpmw must bootstrap and execute pnpm without a preinstalled pnpm binary");
must(compose.includes('docker compose') && compose.includes('docker-compose'),"compose wrapper must prefer Compose v2 and detect legacy v1");
must(compose.includes('Docker Compose is not available'),"compose wrapper must provide an actionable no-Docker failure");
must(!JSON.stringify(tasks).includes('docker-compose -f'),"VS Code tasks must not invoke the removed docker-compose command");
must(pkg.scripts?.['compose:dev:up']==='bash scripts/compose-dev.sh up -d --build',"compose v2 wrapper must be exposed through pnpm");
must(pkg.scripts?.['node-runtime:production:check']==='node scripts/node-runtime-marker-production-check.mjs',"runtime marker check must not be named as an nvm requirement");

if(failures.length){for(const failure of failures)console.error(`[toolchain-bootstrap] ${failure}`);process.exit(1);}
console.log("TOOLCHAIN_BOOTSTRAP_PRODUCTION_CHECK_PASS — no nvm/Corepack dependency, verified user-local Node/pnpm bootstrap, Compose v2-safe tasks");
