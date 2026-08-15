import assert from "node:assert/strict";
import test from "node:test";
import { calculateServiceFeeBaseUnits, validateBaseUnits } from "../src/index";

test("exact bigint service fee", () => assert.equal(calculateServiceFeeBaseUnits(1_000_000n, 250), 25_000n));
test("base-unit parser rejects decimals", () => assert.throws(() => validateBaseUnits("1.5")));
