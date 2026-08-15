# Solana Programs

`programs/solana/powerchain_bridge/` is an auxiliary Anchor intent/audit program.
It does not mint, burn, lock, unlock, or replace Wormhole NTT.

The checked-in program id is a development placeholder. Production validation
fails until `POWERCHAIN_SOLANA_BRIDGE_PROGRAM_ID` points to the real deployment
and the Anchor id is replaced during the deployment workflow.
