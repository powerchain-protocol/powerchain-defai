const expected = "pnpm/11.22.0";
const ua = process.env.npm_config_user_agent ?? "";
if (!ua.startsWith(expected)) {
  console.error(`PowerChain requires pnpm 11.22.0. Detected: ${ua || "unknown package manager"}`);
  console.error("Run: corepack enable && corepack prepare pnpm@11.22.0 --activate");
  process.exit(1);
}
