const MIN = [24, 18, 0];
const MAX_MAJOR = 27;
const current = process.versions.node.split('.').map(Number);
const atLeastMin = current[0] > MIN[0] || (current[0] === MIN[0] && (current[1] > MIN[1] || (current[1] === MIN[1] && current[2] >= MIN[2])));
const supported = atLeastMin && current[0] < MAX_MAJOR;
if (!supported) {
  console.error(`PowerChain requires Node.js >=24.18.0 <27. Detected: ${process.version}`);
  console.error('Local development uses Node.js 26.5.0 via .nvmrc. Run: nvm install && nvm use');
  process.exit(1);
}
