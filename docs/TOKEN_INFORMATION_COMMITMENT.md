# Token information commitment

PowerChain Bridge 1.0.0 binds the canonical PWRC/wPWRC information model to a deterministic SHA-256 commitment.

## Commitment

```text
f6bfd1627686fbff066ee68045a0808be4c1fc69350f3ff35fb501fa28ce51b5
```

The digest is calculated over the `information` object in `config/token.json` using `powerchain-stable-json-v1`: object keys are recursively sorted, arrays preserve order, and JSON scalar encoding is unchanged. The commitment does not contain environment-specific secrets or an invented Sui coin type.

The committed model binds the PowerChain canonical asset ID, PWRC name/symbol, 9 decimals, fixed-supply figures, canonical Solana Token-2022 mint identity, wPWRC's role as the Sui Wormhole NTT representation, the 1:1 principal rule, and the rule that service fees and native gas are separate from bridge principal.

## Runtime verification

`GET /api/v1/token/information` returns the committed model and runtime verification state. `GET /api/v1/bridge/runtime` includes the same information commitment as a blocking readiness check. A mismatched configured PWRC mint, a commitment mismatch, or an unconfigured wPWRC Sui coin type prevents new quote/sign/submit capabilities while existing transfer status remains observable.

This verification does not claim that a deployment exists. Deployment-specific Sui package/object IDs, NTT managers/transceivers, and the wPWRC Sui coin type remain external runtime configuration and must be verified against live chain state before production enablement.

## Programs

The Solana auxiliary program uses a separate `information-commitment` PDA, avoiding a layout change to the existing `BridgeConfig` PDA. Initialization stores the canonical 32-byte commitment and an assertion instruction checks it.

The Sui auxiliary package similarly defines a separate shared `InformationCommitment` object created by the existing bridge authority. Neither object owns token custody or moves bridge principal; Wormhole NTT remains the principal-movement protocol.

## Build integrity

`build-manifest.json` binds the information commitment to the source files that define metadata, protocol types, program logic, SDK/API surfaces, OpenAPI/Swagger and this documentation. Run:

```bash
pnpm information:check
pnpm build-manifest:check
```

A build manifest hash mismatch is a release-integrity failure, not a bridge settlement signal.
