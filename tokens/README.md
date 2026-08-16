# Trusted Tokens

Executable token selection is controlled by the server-owned registry at `apps/backend/src/data/trusted-token-list.ts`. Browser selectors never turn arbitrary text into executable mint or coin-type values.

Current trusted asset families include:

- PWRC on Solana.
- wPWRC on Sui.
- SOL and SUI native assets.
- Circle USDC on Solana and Sui.
- Circle EURC on Solana.

Canonical PWRC/wPWRC artwork is bundled locally. Common ecosystem assets use branded Web3 Icons. An optional licensed `cryptoicons.cc` URL template may be used for presentation only; it never changes token identity or trust.

## Metadata

Token metadata lives under [`metadata/`](metadata/README.md). The legacy root `/metadata` directory is intentionally removed.

## Information commitment

PWRC and wPWRC share canonical asset ID `powerchain-pwrc` and information commitment:

```text
f6bfd1627686fbff066ee68045a0808be4c1fc69350f3ff35fb501fa28ce51b5
```

UI icons and market metadata are presentation/observation layers only. Executable trust comes from the canonical registry plus runtime chain verification.
