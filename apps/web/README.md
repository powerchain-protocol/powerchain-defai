# @powerchain/web

PowerChain's public, light-first marketing and application-entry site. It is a secondary web surface and runs on `http://localhost:3001`.

## Development

```bash
pnpm dev:web
```

The wallet-enabled PowerChain dashboard is the default application at `http://localhost:3000/`:

```bash
pnpm dev
```

Set `NEXT_PUBLIC_APP_URL` to the deployed dashboard origin in production. The website only passes allowlisted route, network, cluster, and bounded resource identifiers to the app handoff; wallet addresses and signing material are not propagated in redirect URLs.

## Structure

- `app/page.tsx` — default marketing homepage.
- `app/pages/` — public long-form product pages.
- `components/about/` — reusable About section and layout.
- `website/shared/ui/` — logo, AI mark, theme and ecosystem primitives.
- `website/wallet/` — client-only wallet discovery/connect UI.
- `website/lib/redirects.ts` — allowlisted dashboard handoff routing.
- `public/visuals/financial-hero.svg` — local light-theme hero artwork.

## Design system

Light mode is the default. The public site uses a light-gray canvas, white surfaces, dark-green primary actions, white secondary actions, dark-green brand text, low-contrast shadows, centered editorial headings, and restrained financial imagery. The final CTA is a dark-green brand panel with white/ghost actions. Dark mode mirrors the hierarchy without changing wallet or execution semantics.

## Security boundaries

Connecting a wallet is not authentication. The website discovers compatible wallets and can hand the user into the application, but signed authentication and executable transactions belong to the dashboard flows. Provider secrets remain server-side.

## Product icon system

Marketing product cards use `website/shared/ui/product-icon.tsx` and infrastructure rows use `feature-icons.tsx`. Icons are product-specific for AI, Chat, Swap, Bridge, Staking, Wallet/Assets, and Runtime Status rather than generic decoration. Each product card links through an allowlisted `/open/[slug]` gateway into its matching application surface; the marketing site never constructs arbitrary app return URLs. The surfaces follow the same light-first dark-green brand language as the dashboard while remaining a separate non-execution marketing boundary.

## Ecosystem branding

The ecosystem section prioritizes Solana, Sui, Pyth, and Supabase with branded icon treatment, followed by the configured bridge/liquidity/edge providers. Brand marks identify integration targets only; availability is still verified at runtime and no logo implies endorsement.
