# PowerChain DeFAI architecture

PowerChain DeFAI is the product layer that now sits above the original bridge-only application. The historical `apps/bridge` directory remains as the compatibility web shell in version 1.0.0, but the product surface includes AI assistance, Swap, Wormhole NTT Bridge, Staking, Portfolio, Assets, Liquidity, Fees, Claims, Wallets and provider integrations.

## Trust model

The AI assistant is advisory only. It can explain data, compare routes, prepare a human-readable plan and surface risks. It cannot sign a wallet message, submit a transaction, bypass payer validation, change a quote, declare bridge completion or act as settlement evidence.

Every executable action follows the same boundary:

```text
AI / UI intent
    ↓
Typed application action
    ↓
Server-side validation + current quote/state
    ↓
Explicit review surface
    ↓
Connected wallet signature
    ↓
Chain / protocol execution
    ↓
Independent status, finality and reconciliation
```

## Ecosystem modules

### AI Assistant

`apps/chat` contains chat/message/prompt types, curated DeFi prompts, saved-prompt state, suggestion UI and chart models. `/chat` is the product entry point. AI output is informational and must be converted into a normal validated application action before a wallet can sign anything.

### Swap

Swap supports Solana and Sui. Solana uses the configured Jupiter execution boundary with Raydium, Meteora and Orca route/pool observations. Sui uses Cetus for executable swaps. The connected wallet remains payer and signer.

### Bridge

Wormhole NTT remains the sole cross-chain principal-movement path for PWRC ↔ wPWRC. Bridge completion requires persisted source/destination finality and reconciliation evidence. AI, market data and DEX routing never become bridge accounting authority.

### Staking

`apps/staking` is deployment-gated. Solana PWRC staking requires a configured program, program-owned config, stake vault, reward vault, and RPC verification. The reward model is a fixed funded pool whose allocation cap, funded/distributed balances, and integer reward rate come only from verified on-chain state; source code does not invent the pool size. Sui wPWRC staking remains non-executable until its package, pool, reward pool, coin type, and runtime verifier are available. The application displays no fabricated APR.

### Portfolio and liquidity

Portfolio and liquidity modules aggregate connected-wallet balances, trusted-token positions and DEX pool observations. These are decision-support inputs, not settlement truth.

## Package map

```text
apps/
├── bridge/          compatibility web shell / Next.js app
├── chat/            DeFAI assistant feature package
├── staking/         staking feature + configuration package
├── backend/         server-only services and integrations
├── worker-bridge/   bridge settlement worker
├── worker-claims/   claim worker
└── worker-fees/     fee worker

packages/
├── protocol/        canonical assets, ecosystem and protocol invariants
├── sdk/             typed PowerChain client
└── database/        durable state
```

## AI context

The assistant may consume browser-safe, read-only context such as selected assets, public route information, portfolio summaries, pool observations, fee disclosures and staking readiness. Secret provider credentials and private wallet keys are never AI context.

Suggested context object:

```ts
interface DefaiChatContext {
  wallet?: { solana?: string; sui?: string };
  capabilities: readonly ("portfolio" | "swap" | "bridge" | "liquidity" | "staking" | "market-data")[];
  network: "mainnet" | "testnet" | "mixed";
}
```

## Charting

`apps/chat/src/charts.ts` defines chart-ready read-only models for portfolio allocation, value history, pool liquidity and staking rewards. Chart data must preserve its source and is explicitly non-authoritative for settlement.

## Saved prompts

`useSavedPrompts()` stores user-curated prompt shortcuts locally under `powerchain.defai.saved-prompts.v1`. Saved prompts are convenience data only and cannot encode a pre-approved wallet signature or transaction.

## Staking deployment rules

Staking fails closed when deployment identifiers or verification evidence are absent. The UI must not infer a vault, pool, program, package, APR, lock period, or reward source. The Solana Anchor program now supplies the on-chain fixed-pool staking state machine, but the UI remains disabled until RPC verification confirms the executable program, program-owned config, canonical PWRC Token-2022 vaults, fixed reward allocation, funding state, and reward policy. Transaction construction/review/signature flows must keep the connected wallet as payer/signer and must not bypass the same verified configuration.

## Versioning

This architecture is part of PowerChain version 1.0.0. The version remains unchanged while the product expands from the historical Bridge name into PowerChain DeFAI.

## Backend ownership

`apps/backend` is the single canonical backend implementation. A duplicate root `backend/` directory is forbidden by the production gate. Claims, fees, Swap execution, DEX adapters, explorer/transaction helpers and worker runtime policy live there. `apps/bridge/server` is limited to Next.js application/API composition that depends directly on the web runtime.

DEX adapters are grouped under `apps/backend/src/integrations/dex/` so executable/pool-routing integrations are not duplicated across the UI and backend. Worker processes in `apps/worker-*` consume canonical runtime configuration from `@powerchain/backend/workers`.

## API workflow architecture

Developer/API workflows are documented in [Postman Flows Architecture](POSTMAN_FLOWS_ARCHITECTURE.md). Those flows may prepare or observe operations, but wallet signing remains external and Bridge settlement remains Wormhole NTT-bound.

## Sui wallet SSR boundary

Mysten dApp Kit wallet detection is browser-only. The root application therefore does not import Mysten wallet hooks from its shared wallet provider. `SuiWalletStateProvider` owns an SSR-safe snapshot, while `sui-wallet-runtime`, the Sui connect button, and the Sui swap island are dynamically loaded with `ssr: false`. This keeps `window` and `document` out of server module evaluation without disabling SSR for the rest of the PowerChain application.
