const SUPPORTED_MAJOR = 24;
const current = Number(process.versions.node.split(".")[0]);
if (current !== SUPPORTED_MAJOR) {
  console.error(`PowerChain requires Node.js 24.x LTS. Detected: ${process.version}`);
  console.error("Run: nvm install 24 && nvm use 24 (see .nvmrc).");
  process.exit(1);
}
