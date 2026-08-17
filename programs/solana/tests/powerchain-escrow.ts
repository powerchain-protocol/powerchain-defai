import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../powerchain_escrow/src/lib.rs", import.meta.url), "utf8");

assert.match(source, /declare_id!\("8AQLAvN5gcV1nbWoEfaPqnorsqJLPjmvEFeZBHkWCKBw"\)/);
for (const seed of ["escrow", "receipt", "allowed_mint", "extensions", "vault"]) {
  assert.match(source, new RegExp(`b\"${seed}\"`));
}
for (const instruction of ["create_escrow", "set_allowed_mint", "set_extensions", "make_immutable", "deposit", "withdraw"]) {
  assert.match(source, new RegExp(`pub fn ${instruction}`));
}
for (const hook of ["PreDeposit", "PostDeposit", "PreWithdraw", "PostWithdraw"]) {
  assert.match(source, new RegExp(hook));
}
for (const extension of ["PermanentDelegate", "NonTransferable", "Pausable", "TransferHook"]) {
  assert.match(source, new RegExp(extension));
}
assert.match(source, /EscrowImmutable/);
assert.match(source, /token_interface::transfer_checked/);
assert.match(source, /credited_base_units/);
assert.match(source, /received_base_units/);
assert.match(source, /pub depositor:Signer<'info>/);
assert.doesNotMatch(source, /Keypair|secretKey|seed phrase|private key/i);
assert.match(source, /AccountMeta::new\(\*account\.key,false\)/);
assert.match(source, /AccountMeta::new_readonly\(\*account\.key,false\)/);
assert.doesNotMatch(source, /AccountMeta::new\(\*account\.key,account\.is_signer\)/);
