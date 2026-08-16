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

## Application shell and route resilience

The Bridge app now treats navigation and route failures as part of the product experience rather than isolated framework states.

- Claim, Wallet, and Integrations have route-level loading skeletons and recoverable error boundaries.
- The global not-found page makes it explicit that a routing error cannot submit a wallet action or transfer.
- A shared footer provides consistent access to Bridge, Wallet, Assets, History, Fees, and Integrations.
- Assets and Fees use the global application container instead of applying a second horizontal page gutter.
- Integrations uses the same page-header, card, enabled/disabled-state, and accessibility language as the rest of the Bridge product.
- History surfaces the number of displayed transfers and offers a one-action filter reset.
- Global reduced-motion CSS minimizes nonessential animation and transition duration when the operating system requests reduced motion.

These shell-level states remain read-only. A route render error, missing page, or provider-status display failure must never imply that a transaction was signed, submitted, finalized, or lost.

## Documentation experience

Developer-facing UX is treated as part of the product surface. The root README now provides a short path from architecture to setup and release validation, while `docs/README.md` provides one canonical index for detailed operational material. Scoped READMEs describe ownership only, reducing duplicated or conflicting setup instructions.

## Production dashboard redesign

The production Bridge shell now follows the supplied PowerChain visual references without copying unsupported example metrics.

- Large screens use a solid dark PowerChain navigation rail and a light settlement workspace.
- Small screens use a compact brand header and safe-area bottom navigation instead of compressing the desktop sidebar.
- The Wormhole NTT transfer surface is the visual focal point and clearly labels the default Sui wPWRC → Solana PWRC direction.
- Canonical PowerChain, PWRC, and wPWRC artwork is served locally from the Bridge app and optimized for application use.
- The network-settlement overview renders runtime provider evidence: status, finalized head, latency, transport, and configured endpoint availability.
- Recent transfers come from the persisted bridge-history API and fail safely when the database/history service is unavailable.
- Reference-only TVL, TPS, success-rate, carbon-neutral, ZK-proof, and unsupported multi-chain claims are not reproduced as production facts.
- Cinematic depth uses restrained vertical gradients and controlled glassmorphism only for navigation and hero-level transaction surfaces; operational evidence stays readable with solid or high-opacity surfaces.

The security boundary is unchanged: Wormhole NTT remains the sole cross-chain principal movement protocol, and persisted finality/reconciliation evidence remains authoritative for completion.

## Cinematic light and dark themes

The application now defaults to a cinematic light theme using white, light gray, dark forest green, onyx, and black. A persistent toggle switches to a matching onyx/black dark theme without relying on the OS theme after the user makes a choice. Bright emerald accents are intentionally excluded; semantic success, warning, and failure states remain distinguishable without turning the product into a neon interface.

## Theme persistence and mobile discovery

The theme preference is applied before React hydration so a persisted light-theme selection does not flash back to the default dark shell during reload. Theme changes also synchronize across open tabs and update the browser theme color.

Mobile keeps the five highest-frequency destinations in the bottom navigation and exposes the complete application map through an accessible header menu. The drawer supports Escape, focus containment, focus restoration, backdrop dismissal, and background scroll locking. This keeps Claim and Integrations discoverable without overcrowding the bottom bar.

The application shell now treats white, light gray, onyx, neutral slate, and dark forest green as the primary UI palette. Blue is not used for generic buttons, focus rings, progress states, or informational surfaces; chain branding can still be expressed through actual network artwork when supplied.

Root loading and error boundaries match the same visual system, and the web-app manifest uses the local PowerChain icon with an onyx standalone background.

## Navigation and live-operation refinement

The application navigation now uses one SVG icon vocabulary across desktop and mobile surfaces instead of platform-dependent text glyphs. Mobile primary navigation adds a restrained active indicator while the full drawer remains the route-discovery surface for Claim and Integrations.

Recent Transfers is now a resilient operational surface rather than a one-shot dashboard fetch. It aborts superseded/unmounted requests, refreshes only while the document is visible and online, exposes manual retry/refresh actions, shows relative operation time, and keeps the last successful snapshot visible with an explicit warning if a later refresh fails. Provider status also exposes data freshness so a healthy badge is not presented without temporal context.

## Endpoint diagnostics and offline resilience

Provider diagnostics are evidence-based rather than configuration-count based. A fallback endpoint is considered ready only when it is healthy and its circuit is closed. Failed Sui gRPC probes report no live redundancy even if multiple URLs are configured.

The network settlement overview exposes only safe endpoint identifiers, health/circuit state, and a full/reduced/unavailable fallback-readiness label. Endpoint URLs and provider credentials are never rendered.

The provider-health hook also tracks browser online/offline state. When the browser is offline, automatic provider requests pause, the last successful snapshot may remain visible as historical context, and manual refresh controls indicate the offline state instead of producing repeated network failures.

The mobile sticky action surface uses a solid light/onyx background rather than backdrop blur so transaction actions remain legible over complex content and align with the production shell's no-glass treatment.
