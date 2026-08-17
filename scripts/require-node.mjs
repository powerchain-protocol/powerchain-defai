const [major = 0] = process.versions.node.split(".").map(Number);
const supported = major >= 24 && major < 26;
if (!supported) {
  console.error(`PowerChain requires Node >=24 <26; current runtime is ${process.version}.`);
  console.error("Recommended: run from the monorepo root: source ./bootstrap.sh");
  console.error("The reproducible project runtime is Node 24.19.0 with pnpm 11.22.0.");
  process.exit(1);
}
console.log(`Node ${process.version} satisfies package engine >=24 <26.`);
