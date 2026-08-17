# Product safety, consent and legal surfaces

PowerChain DeFAI keeps product-safety state separate from wallet identity and settlement evidence.

## Cookie consent

The client stores `pc_cookie_consent` as a first-party `SameSite=Lax` cookie and mirrors the decision to `powerchain.defai.cookie-consent.v1` in local storage. The selection expires after 180 days. The banner stays hidden after a valid choice and can be reopened with **Cookie choices** in the footer.

The source release uses browser storage for essential product preferences and recovery state. Optional analytics or marketing storage must remain disabled unless a deployment adds it and receives the required consent.

## Legal routes

- `/legal/privacy`
- `/legal/terms`
- `/legal/cookies`
- `/legal/disclaimer`

These are production-ready application surfaces but remain operator templates. The deploying entity must review jurisdiction-specific legal text before launch.

## IP abuse protection

`clientIpSecurityContext()` ignores generic `X-Forwarded-For` and `X-Real-IP` headers. When `VERCEL=1`, it may read Vercel's platform `x-vercel-forwarded-for` value. When `POWERCHAIN_RUNTIME_PLATFORM=cloudflare`, it may read Cloudflare's `CF-Connecting-IP` value. In both cases the value is validated as an IP address and converted to a pseudonymous rate-limit key. `POWERCHAIN_IP_HASH_SECRET` may provide a stable HMAC key; otherwise a process-local random salt is used so the raw IP does not become the stored rate-limit key.

IP-derived state is never authoritative for wallet identity, transaction authorization, or Bridge accounting.

## Program input hardening

The auxiliary Solana and Sui Bridge programs reject zero quote digests and empty or oversized destination identifiers before emitting intent events. These programs still do not mint, burn, lock, unlock or settle cross-chain principal. Wormhole NTT remains the sole PWRC/wPWRC principal-movement protocol.
