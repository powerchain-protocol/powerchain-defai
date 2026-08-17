import fs from "node:fs";

const required = [
  ".devcontainer/devcontainer.json",
  ".devcontainer/docker-compose.yml",
  ".devcontainer/Dockerfile",
  ".devcontainer/devcontainer.env.example",
  ".devcontainer/init-env.sh",
  ".devcontainer/post-create.sh",
];
const failures = [];
for (const file of required) if (!fs.existsSync(file)) failures.push(`missing ${file}`);

if (!failures.length) {
  const config = JSON.parse(fs.readFileSync(".devcontainer/devcontainer.json", "utf8"));
  const compose = fs.readFileSync(".devcontainer/docker-compose.yml", "utf8");
  const dockerfile = fs.readFileSync(".devcontainer/Dockerfile", "utf8");
  const init = fs.readFileSync(".devcontainer/init-env.sh", "utf8");
  const post = fs.readFileSync(".devcontainer/post-create.sh", "utf8");
  const gitignore = fs.readFileSync(".gitignore", "utf8");
  const dockerignore = fs.readFileSync(".dockerignore", "utf8");
  const localDb = fs.readFileSync("scripts/local-postgres.mjs", "utf8");
  const stackBootstrap = fs.readFileSync("scripts/dev-stack-bootstrap.sh", "utf8");

  if (config.service !== "workspace") failures.push("devcontainer must attach to workspace service, not PostgreSQL");
  if (config.workspaceFolder !== "/workspaces/powerchain-defai") failures.push("devcontainer workspaceFolder must be /workspaces/powerchain-defai");
  if (!Array.isArray(config.dockerComposeFile) || config.dockerComposeFile[0] !== "../compose.dev.yaml" || config.dockerComposeFile[1] !== "docker-compose.yml") failures.push("devcontainer compose layering is incorrect");
  if (!Array.isArray(config.runServices) || !config.runServices.includes("postgres") || !config.runServices.includes("workspace")) failures.push("devcontainer runServices must include postgres and workspace");
  if (!Array.isArray(config.forwardPorts) || !config.forwardPorts.includes(3000) || config.forwardPorts.includes(5432)) failures.push("devcontainer may forward app port 3000 but must not forward PostgreSQL 5432");
  if (config.remoteUser !== "node") failures.push("devcontainer remoteUser must be node");

  if (!compose.includes("dockerfile: .devcontainer/Dockerfile")) failures.push("devcontainer workspace must build the pinned runtime image");
  if (!compose.includes("/workspaces/powerchain-defai")) failures.push("devcontainer must mount the repository at /workspaces/powerchain-defai");
  if (!compose.includes("ports: !reset []")) failures.push("devcontainer must remove the base PostgreSQL host port");
  if (!compose.includes("environment: !reset {}")) failures.push("devcontainer must remove hard-coded base PostgreSQL credentials");
  if (!compose.includes(".devcontainer/devcontainer.env")) failures.push("devcontainer services must read generated env file");
  if (!compose.includes('pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}')) failures.push("devcontainer PostgreSQL healthcheck must use generated database identity");
  if (!compose.includes("powerchain_defai_devcontainer_postgres_data:/var/lib/postgresql/data")) failures.push("devcontainer PostgreSQL must use an isolated data volume");
  if (!compose.includes('POWERCHAIN_DEVCONTAINER: "1"')) failures.push("workspace must identify the devcontainer runtime");
  if (!compose.includes("no-new-privileges:true")) failures.push("workspace must enable no-new-privileges");
  if (/docker\.sock|privileged:\s*true/i.test(compose)) failures.push("devcontainer must not expose Docker socket or privileged mode");

  if (!dockerfile.includes("mcr.microsoft.com/devcontainers/typescript-node:24-bookworm")) failures.push("devcontainer must use the Node 24 devcontainer base image");
  if (!dockerfile.includes('npm install --global "pnpm@${PNPM_VERSION}"')) failures.push("devcontainer image must provision pinned pnpm directly so development does not depend on Corepack availability");
  if (!dockerfile.includes("ARG PNPM_VERSION=11.22.0")) failures.push("devcontainer image must pin pnpm 11.22.0");

  if (!init.includes("openssl rand -hex 32") || !init.includes("chmod 600") || !init.includes("umask 077")) failures.push("devcontainer init must generate and permission a random database credential");
  if (!init.includes("Secret values were not printed")) failures.push("devcontainer init must document non-echoed secrets");
  if (!post.includes("pnpm install --frozen-lockfile") || !post.includes("pnpm install --no-frozen-lockfile") || !post.includes("pnpm workspace:install:check")) failures.push("post-create install lifecycle is incomplete");
  if (post.includes("corepack") || post.includes("nvm install")) failures.push("post-create must not depend on Corepack or nvm");
  if (!gitignore.includes(".devcontainer/devcontainer.env")) failures.push("generated devcontainer env must be gitignored");
  if (!dockerignore.includes(".devcontainer/devcontainer.env")) failures.push("generated devcontainer env must be dockerignored");
  if (!localDb.includes('process.env.POWERCHAIN_DEVCONTAINER === "1"') || !localDb.includes('host === "postgres"')) failures.push("local database helper must recognize the devcontainer postgres service");
  if (!stackBootstrap.includes('POWERCHAIN_DEVCONTAINER:-0') || !stackBootstrap.includes('verifying the existing pnpm workspace without deleting its lockfile')) failures.push("full-stack bootstrap must preserve the devcontainer lockfile");
}

if (failures.length) {
  console.error("Devcontainer production check failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log("DEVCONTAINER_PRODUCTION_CHECK_PASS — PowerChain DeFAI workspace, Node 24 image, pinned pnpm, internal PostgreSQL, generated ignored credentials");
