# Token Metadata

This directory contains checked-in PWRC/wPWRC metadata and provider metadata used for release/integrity review.

Resolution follows a fail-safe source order:

1. canonical PowerChain token information and bundled PWRC/wPWRC artwork;
2. verified on-chain identifiers/metadata;
3. Helius DAS and canonical Metaplex PDA context for supported Solana assets;
4. optional external visual/market metadata for presentation only.

External market metadata is never authoritative for Bridge accounting or finality. The optional `cryptoicons.cc` integration is a caller-supplied asset URL template; the repository does not fabricate a public cryptoicons.cc API.

## PWRC/wPWRC commitment

`pwrc.json` and `wpwrc.json` carry the SHA-256 information commitment from `config/token.json`:

```text
f6bfd1627686fbff066ee68045a0808be4c1fc69350f3ff35fb501fa28ce51b5
```

The commitment binds canonical token semantics and PWRC identity. Environment-specific Sui package/coin/object identifiers and Wormhole deployment values are verified separately and are never invented in metadata.

## Product and social links

PWRC and wPWRC metadata include the verified PowerChain product URLs for the website, Swap, and Bridge surfaces. Social-account fields use a `verified-only` policy: X, Discord, Telegram, and GitHub remain unset until the operator supplies confirmed official account URLs. This prevents token metadata from publishing guessed or impersonated social links.

The canonical operator-facing link registry is `config/socials.json`; optional browser-safe social URLs can be supplied with the `NEXT_PUBLIC_POWERCHAIN_*_URL` environment variables.
