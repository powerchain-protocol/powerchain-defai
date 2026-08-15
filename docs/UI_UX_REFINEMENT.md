# UI/UX refinement

PowerChain Bridge keeps the bridge action primary and treats diagnostics as supporting context.

## Bridge page hierarchy

The `/bridge` page is ordered as follows:

1. page purpose and protocol context;
2. provider health;
3. resumable-transfer notice when an operation is active;
4. Wormhole NTT transfer interface;
5. asset, runtime and finalized-chain context;
6. accounting/finality disclosure.

The transfer interface appears before secondary diagnostics on desktop and mobile so operational detail does not obscure the primary user task.

## Navigation

Primary navigation exposes the active route with `aria-current="page"` and a visible selected state. Mobile navigation remains horizontally scrollable without showing a persistent scrollbar.

A keyboard-accessible skip link targets the application content container.

## Wallet connection

The header keeps wallet controls compact on small screens. The wallet chooser:

- supports Escape to close;
- traps Tab focus while open;
- restores focus to the previously focused element;
- prevents background scrolling;
- closes when the backdrop is selected;
- explains that private keys and seed phrases are never requested.

## Loading and failure states

Bridge and History routes provide route-level loading skeletons and recoverable error screens. Error copy does not imply that a transfer was submitted or lost when only the page render failed.

History renders compact cards on small screens and a denser row layout on larger screens. Status filters are validated against the supported persisted transfer-state set before reaching Prisma.

## Data safety

Live chain UI treats API payloads as `unknown` until narrowed. Nested response data is only read from successful object envelopes.

Bridge completion remains based on persisted finality and reconciliation evidence. Wallet, explorer, market and ordinary display RPC data remain supporting UX context only.

## Markdown quality

`pnpm markdown:check` enforces:

- MD012: no multiple consecutive blank lines;
- MD022: blank lines around headings;
- MD032: blank lines around lists.

Use `pnpm docs:fix` to normalize Markdown whitespace and then re-run the Markdown gate.
