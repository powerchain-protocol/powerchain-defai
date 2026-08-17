import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../powerchain_staking/src/lib.rs", import.meta.url), "utf8");

assert.match(source, /declare_id!\("Stake11111111111111111111111111111111111111"\)/);
assert.match(source, /const PWRC_MINT: Pubkey = pubkey!\("PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc"\)/);
assert.match(source, /pub struct InitializeConfigArgs/);
assert.match(source, /pub reward_allocation_cap_base_units: u64/);
assert.match(source, /reward_allocation_cap_base_units > 0/);
assert.doesNotMatch(source, /REWARD_ALLOCATION_CAP_BASE_UNITS/);
assert.match(source, /pub fn initialize_config/);
assert.match(source, /pub fn initialize_position/);
assert.match(source, /pub fn fund_rewards/);
assert.match(source, /pub fn stake/);
assert.match(source, /pub fn request_unstake/);
assert.match(source, /pub fn withdraw_unstaked/);
assert.match(source, /pub fn claim_rewards/);
assert.match(source, /reward_rate_ppm_per_epoch/);
assert.match(source, /RewardPolicyLockedWhileStaked/);
assert.match(source, /TransferAmountTooSmall/);
assert.match(source, /anchor_spl::token_2022::ID/);
assert.match(source, /InvalidTokenProgram/);
assert.match(source, /pub owner: Signer<'info>/);
assert.match(source, /credited_base_units/);
assert.match(source, /received_base_units/);
assert.doesNotMatch(source, /mint_to\s*\(/);
assert.doesNotMatch(source, /set_authority\([^)]*mint/i);
