# Program deployment evidence validation — 2026-08-17

Validated source invariants:

- Solana Bridge readiness requires an executable account owned by a recognized executable-program loader.
- Loader v1, loader v2, upgradeable loader, and loader v4 are represented in the verifier allowlist.
- Sui Bridge readiness requires the configured BridgeConfig and InformationCommitment objects to resolve as shared objects in addition to matching the configured package and Move types.
- Deployment-evidence details are represented by a strict discriminated runtime type and validated before client use.
- Protocol UI surfaces loader/shared-object evidence without presenting it as upgrade-authority or settlement proof.

Run:

```bash
node scripts/program-deployment-evidence-production-check.mjs
```
