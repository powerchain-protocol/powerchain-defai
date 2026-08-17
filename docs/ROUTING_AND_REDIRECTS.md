# Routing and redirects

PowerChain DeFAI uses one canonical browser-route contract in `apps/bridge/config/app-routes.ts`.

## Canonical application routes

- `/` — command center / workspace overview
- `/chat` — home / DeFAI assistant
- `/swap` — wallet-signed swaps
- `/bridge` — Wormhole NTT bridge
- `/staking` — deployment-gated staking
- `/wallet` — balances and wallet state
- `/history` — operation history and recovery
- `/explorer` — read-only chain explorer
- `/claim` — claim flow
- `/assets` — canonical asset information
- `/fees` — service/network fee disclosure
- `/integrations` — configured protocol/provider integrations
- `/status` — provider health, redundancy and execution readiness

Desktop navigation is grouped into Overview, Intelligence, Markets, Portfolio, Network, and Account sections. The command-center header/sidebar/footer shell persists across the operational workspace, including Swap, Bridge, Chat, Staking, Wallet, History, Explorer and runtime pages. Mobile navigation and Next redirects consume the same canonical route registry rather than maintaining unrelated route lists.

## Compatibility redirects

`/dashboard` is a permanent compatibility redirect to the canonical root dashboard at `/`.

Legacy/product aliases such as `/stake`, `/rewards`, `/validators`, `/transactions`, `/activity`, `/portfolio`, `/account`, `/docs`, `/swagger`, and `/openapi` redirect to canonical application or API-documentation paths. Redirect sources are unique, framework-relative, and checked for loops.

`/validators` and `/rewards` intentionally resolve to `/staking`; PowerChain does not expose fabricated validator rankings or APR/APY pages when that model is not verified by the configured staking deployment.

## Backend route matching

`@powerchain/backend/routing` normalizes API paths, rejects malformed encoding and dot-segment traversal, and supports `:parameter` route definitions such as `/api/v1/staking/transactions/:signature`. Critical provider, staking, escrow, payment, wallet, bridge, and swap routes are represented in the core router with explicit risk/rate-limit metadata.

## Validation

- `pnpm app-routing:production:check` verifies canonical pages, compatibility redirects, typed routes, navigation registration, and literal internal links.
- `pnpm backend-routing:production:check` verifies the critical server route registry, dynamic matching, and path-normalization hardening.
- `pnpm route:check` verifies API action synchronization and redirect aliases.
