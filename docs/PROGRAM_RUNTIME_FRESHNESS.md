# Program runtime freshness

PowerChain treats repository source, configured identifiers, live runtime evidence, and fresh client evidence as separate states.

## Bounded verification

Every program verifier is wrapped by a bounded response deadline controlled by `POWERCHAIN_PROGRAM_VERIFIER_TIMEOUT_MS`. The default is 7000 ms and the accepted range is 1000–15000 ms.

A timeout degrades only the affected program to `unavailable` with timeout evidence. It does not erase evidence returned for the other programs and it does not imply that a deployment is absent or failed on-chain. The deadline bounds the API response path; it is not transaction cancellation or replay authority.

## Client evidence freshness

The Protocol UI refreshes runtime evidence periodically. Evidence becomes stale on the client after twice the active refresh interval, with a minimum freshness window of 60 seconds. Stale evidence remains visible for diagnosis but is labeled `Stale evidence` and the UI asks the operator to verify it again before relying on the displayed state.

Core bridge evidence has a separate aggregate freshness signal. A previously green Solana/Sui bridge result cannot remain visually current forever when the browser is offline or backgrounded.

## Safety boundary

Program readiness remains read-only and is not authoritative for settlement. Source-controlled program IDs, package IDs, or object IDs are not deployment proof. Wallet signing, custody, bridge principal movement, and reconciliation remain outside this status surface.
