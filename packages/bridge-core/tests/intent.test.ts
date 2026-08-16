import test from "node:test";
import assert from "node:assert/strict";
import { canonicalBridgeIntent } from "../src/intent";

test("canonicalizes a Sui to Solana intent", () => {
  const intent = canonicalBridgeIntent({ direction: "SUI_TO_SOLANA", amountBaseUnits: 1n, destination: "11111111111111111111111111111111", quoteCommitment: "11".repeat(32) });
  assert.equal(intent.directionCode, 1);
  assert.equal(intent.version, 2);
});

test("rejects an all-zero quote commitment", () => {
  assert.throws(() => canonicalBridgeIntent({ direction: "SUI_TO_SOLANA", amountBaseUnits: 1n, destination: "11111111111111111111111111111111", quoteCommitment: "00".repeat(32) }), /ZERO_FORBIDDEN/);
});
