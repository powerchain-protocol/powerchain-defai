# Swap dependency surface validation — 2026-08-17

Validated the explicit PowerChain swap/root dependency contract after the monorepo dependency upgrade.

The production source gate requires the pinned root and `/swap` application packages, rejects an npm `fs` dependency, and rejects the incorrect `@solana/token-metadata` package name in favor of `@solana/spl-token-metadata`.

This validation is dependency-independent. It does not claim that the package manager lockfile was regenerated or that dependency installation/build execution completed in this artifact runner.
