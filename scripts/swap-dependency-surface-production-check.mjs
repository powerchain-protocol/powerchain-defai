import { readFile } from "node:fs/promises";

const rootPackage = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const swapPackage = JSON.parse(await readFile(new URL("../apps/bridge/package.json", import.meta.url), "utf8"));

const expectedRoot = {
  "@coral-xyz/anchor": "0.32.1",
  "@solana/kit": "7.1.0",
  "@solana/spl-token": "0.4.15",
  "@solana/spl-token-metadata": "0.1.6",
  "node-fetch": "3.3.2",
  "uuid": "14.0.1",
  "ws": "8.21.3",
  "zod": "4.4.3",
};

const expectedSwap = {
  "@jup-ag/api": "6.0.48",
  "axios": "1.19.0",
  "bs58": "6.0.0",
};

function assertSurface(actual, expected, label) {
  for (const [name, version] of Object.entries(expected)) {
    if (actual?.[name] !== version) {
      throw new Error(`${label} dependency ${name} must be pinned to ${version}; found ${actual?.[name] ?? "missing"}`);
    }
  }
}

assertSurface(rootPackage.dependencies, expectedRoot, "root");
assertSurface(swapPackage.dependencies, expectedSwap, "swap app");

if (rootPackage.dependencies?.fs || rootPackage.devDependencies?.fs || swapPackage.dependencies?.fs) {
  throw new Error("Do not install npm package 'fs'; PowerChain Node.js code must use the built-in node:fs module.");
}
if (rootPackage.dependencies?.["@solana/token-metadata"] || swapPackage.dependencies?.["@solana/token-metadata"]) {
  throw new Error("Use the official @solana/spl-token-metadata package; @solana/token-metadata is not the configured dependency.");
}

console.log(`SWAP_DEPENDENCY_SURFACE_PRODUCTION_CHECK_PASS root=${Object.keys(expectedRoot).length} swap=${Object.keys(expectedSwap).length}`);
