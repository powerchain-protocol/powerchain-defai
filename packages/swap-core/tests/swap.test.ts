import test from "node:test";
import assert from "node:assert/strict";
import { assertMinimumOutput, assertSlippageBps, bpsFeeBaseUnits, canTransitionSwapState, minimumOutputBaseUnits, swapQuoteProtection } from "../src/swap";

test("swap math uses integer base units", () => {
  assert.equal(minimumOutputBaseUnits("1000000", 50), "995000");
  assert.equal(bpsFeeBaseUnits("1000000", 250), "25000");
});

test("swap bounds are fail closed", () => {
  assert.throws(() => assertSlippageBps(0), /SWAP_SLIPPAGE_OUT_OF_RANGE/);
  assert.throws(() => assertMinimumOutput("99", "100"), /SWAP_PRICE_PROTECTION_TRIGGERED/);
});

test("quote TTL and state transitions are bounded", () => {
  const quote = swapQuoteProtection("1000", 50, 1_000_000, 30_000);
  assert.equal(quote.minimumOutputBaseUnits, "995");
  assert.equal(canTransitionSwapState("review", "awaiting-signature"), true);
  assert.equal(canTransitionSwapState("idle", "confirmed"), false);
});
