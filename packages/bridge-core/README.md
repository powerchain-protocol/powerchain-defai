# @powerchain/bridge-core

Canonical off-chain bridge intent rules shared by API, workers, SDK-facing services, and program builders.

This package does **not** move principal. Wormhole NTT remains the sole cross-chain principal movement protocol for PWRC/wPWRC.

It centralizes direction codes, destination normalization, quote commitment validation, amount bounds, and versioned intent metadata so backend code does not reproduce program rules ad hoc.
