# Program deployment evidence

PowerChain Protocol readiness separates configured identifiers from executable deployment evidence.

## Solana Bridge Guard

The configured program address is queried through the active Solana RPC provider. A positive runtime result requires all of the following:

- the account exists at the configured program address;
- the account is executable;
- the evidence response is fresh;
- the program account owner is one of the recognized Solana executable-program loaders supported by the runtime verifier.

The loader owner is returned as diagnostic deployment evidence. It is not an assertion about upgrade authority, governance, source-code identity, or program provenance.

An executable account with an unrecognized owner remains gated with `SOLANA_BRIDGE_PROGRAM_LOADER_UNRECOGNIZED`.

## Sui Bridge Guard

The configured package, BridgeConfig object, and InformationCommitment object are queried through the active Sui RPC provider. Positive runtime evidence requires:

- the configured package resolves as a package object;
- the BridgeConfig object has the expected Move type under that package;
- the InformationCommitment object has the expected Move type under that package;
- both guard objects are live shared objects, matching the source package's `transfer::share_object` lifecycle;
- all evidence is fresh.

A type match without the expected shared-object ownership mode remains gated.

## Boundary

Deployment evidence is read-only operational evidence. It does not prove source reproducibility, audit status, upgrade-authority policy, settlement finality, or custody safety by itself. The Protocol surface remains non-custodial and does not sign or submit transactions.
