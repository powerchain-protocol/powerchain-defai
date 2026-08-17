const ua = process.env.npm_config_user_agent ?? "";
const match = ua.match(/^pnpm\/(\d+)\.(\d+)\.(\d+)/);
const hint = "Run: source ./bootstrap.sh (or rebuild the repository Dev Container).";
if (!match) {
  console.error(`PowerChain requires pnpm >=11.22.0 <12. Detected: ${ua || "unknown package manager"}`);
  console.error(hint);
  process.exit(1);
}
const [, majorText, minorText] = match;
const major = Number(majorText);
const minor = Number(minorText);
if (major !== 11 || minor < 22) {
  console.error(`PowerChain requires pnpm >=11.22.0 <12. Detected: ${match[0]}`);
  console.error(hint);
  process.exit(1);
}
console.log(`${match[0]} satisfies >=11.22.0 <12.`);
