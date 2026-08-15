const MIN = [24, 0, 0];
const MAX_MAJOR = 27;
const current = process.versions.node.split(".").map(Number);
const atLeastMin = current[0] > MIN[0] || (current[0] === MIN[0] && (current[1] > MIN[1] || (current[1] === MIN[1] && current[2] >= MIN[2])));
const supported = atLeastMin && current[0] < MAX_MAJOR;
if (!supported) {
  console.error(`PowerChain requires Node.js >=24.0.0 <27. Detected: ${process.version}`);
  console.error("Recommended local runtime: nvm install && nvm use (see .nvmrc). Node 24.x is also supported.");
  process.exit(1);
}
