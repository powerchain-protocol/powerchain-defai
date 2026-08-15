import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
test("NTT is documented as sole principal bridge", () => {
  const contracts = fs.readFileSync("contracts/README.md", "utf8");
  assert.match(contracts, /Wormhole NTT remains the sole cross-chain principal movement protocol/);
});
