# Monorepo routing runtime

PowerChain browser navigation, compatibility aliases and dynamic route builders are centralized in `apps/bridge/config/app-routes.ts`. Components should consume `APP_ROUTES` or the bounded dynamic builders rather than interpolate externally sourced identifiers into paths.

## Runtime guarantees

- Compatibility redirects are single-hop. Redirect chains, cycles and duplicate sources fail the production gate.
- Dynamic transfer, claim and staking transaction identifiers are bounded to one URL segment before encoding. Slash, backslash, dot-segment and control-character ambiguity is rejected.
- Every high-frequency workspace owns a route-level loading boundary in addition to the root loading boundary.
- `global-error.tsx` is the last-resort application-shell boundary and never infers transaction success from a rendering failure.
- The custom 404 links only to canonical route constants.
- `robots.ts` prevents indexing of API and dynamic operation-status surfaces.
- Backend API routing continues to normalize and reject malformed/traversal paths before rate-limit policy is selected.

## Adding a page or redirect

1. Add the canonical page to `APP_ROUTES`.
2. Add its `app/<route>/page.tsx` and `loading.tsx`.
3. Add navigation only through `components/navigation/navigation-config.ts`.
4. Add compatibility aliases to `APP_REDIRECTS`; point them directly at the final canonical destination.
5. Use a bounded route builder for any dynamic external identifier.
6. Run `pnpm app-routing:production:check`, `pnpm routing-runtime:production:check`, and `pnpm routes:check`.
