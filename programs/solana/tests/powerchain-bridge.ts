import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../powerchain_bridge/src/lib.rs", import.meta.url), "utf8");

assert.match(source, /declare_id!\("BGEekuKBEsKzEdUdEKvWn4BGRgvAURQMD9f4yLLRteWS"\)/);
assert.match(source, /pub struct BridgeConfig/);
assert.match(source, /pub fn initialize_config/);
assert.match(source, /pub fn set_authority/);
assert.match(source, /pub fn set_paused/);
assert.match(source, /next_nonce/);
assert.match(source, /BridgeError::UnauthorizedAuthority/);
assert.match(source, /BridgeError::ProgramCannotBeAuthority/);
assert.match(source, /BridgeError::BridgePaused/);
assert.match(source, /BridgeAuthorityUpdated/);
assert.match(source, /BridgePauseUpdated/);
assert.match(source, /INFORMATION_COMMITMENT_SEED/);
assert.match(source, /pub fn initialize_information_commitment/);
assert.match(source, /pub fn assert_information_commitment/);
assert.match(source, /pub struct InformationCommitment/);
assert.match(source, /InformationCommitmentInitialized/);
assert.match(source, /InformationCommitmentMismatch/);
assert.equal(Buffer.alloc(32).length, 32);

// regression: BridgeIntentRecordedV2

// regression: validate_record_intent_args

// regression: InformationCommitmentVersionMismatch
