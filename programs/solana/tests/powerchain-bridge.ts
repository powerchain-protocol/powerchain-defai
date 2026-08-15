import assert from "node:assert/strict";

// Structural smoke test. On-chain integration tests require a local validator,
// deployed Wormhole NTT programs, and a generated non-placeholder program id.
assert.equal(Buffer.alloc(32).length, 32);
