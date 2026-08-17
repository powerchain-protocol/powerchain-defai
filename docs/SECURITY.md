# Security Policy

PowerChain DeFAI is production-oriented financial and blockchain infrastructure. Security reports should be handled privately and should never include secrets in public issues, commits, screenshots, logs, or chat transcripts.

## Supported release

The actively maintained release line is `1.0.x`. Security fixes may be applied without changing protocol deployment identifiers or relaxing runtime verification gates.

## Reporting

Use an authorized private PowerChain security or engineering channel. Include the affected component, reproducible steps, expected and observed behavior, impact, and the smallest safe proof of concept. Do not include production private keys, seed phrases, API secrets, database credentials, signing material, or customer data.

## Security boundaries

- Connected wallets remain the signing authority for user transactions.
- Backend services must not expose custody keys or provider secrets to browser bundles.
- Source-controlled program IDs are not proof of live deployment; runtime verification remains required.
- Cross-chain principal movement must follow the repository's canonical protocol policy and deployment evidence gates.
- Production configuration must fail closed when mandatory secrets, RPC endpoints, database state, or deployment evidence are absent.
- Dependency installation and release promotion must use the committed pnpm lockfile and the repository's production checks.

## Before promotion

Run `pnpm release:check` and the environment-specific smoke/deployment checks from a clean Node 24/25 / pnpm 11 environment. Resolve every failure rather than bypassing a security or readiness gate.
