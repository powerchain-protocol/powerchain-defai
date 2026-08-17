# PowerChain Staking

PowerChain Staking 1.0.0 is a deployment-gated PWRC/wPWRC feature. The repository contains a Solana Anchor staking program, runtime verification, the `/staking` application surface, and `/api/v1/staking/status`. A configured value is not considered verified merely because it exists in an environment variable.

## Canonical staking policy

| Property | Value |
| --- | --- |
| Reward model | Fixed pool |
| Reward asset | PWRC on Solana; wPWRC representation only after a verified Sui staking deployment exists |
| Fixed reward allocation | the deployment-configured funded reward cap |
| Fixed reward allocation cap | Read from and verified against deployed on-chain config |
| Reward-rate source | Verified on-chain staking configuration |
| APR policy | Never fabricate or hard-code APR |
| Signing authority | Connected wallet |
| Backend custody | Forbidden |

The fixed reward allocation is preserved as an existing staking parameter. It is not silently recomputed from later token-supply metadata.

## Verified identifiers

The staking application separates repository-pinned identifiers from live deployment evidence.

Repository-pinned Solana identifiers:

- canonical PWRC mint: `PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc`;
- Token-2022 program: `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`.

Live Solana staking requires all of the following server-only values:

```text
POWERCHAIN_SOLANA_STAKING_PROGRAM_ID=
POWERCHAIN_SOLANA_STAKING_CONFIG=
POWERCHAIN_SOLANA_STAKING_VAULT=
POWERCHAIN_SOLANA_STAKING_REWARD_VAULT=
POWERCHAIN_SOLANA_RPC_URL=
```

The runtime verifies that the program account is executable, the staking config is owned by that program, both vaults are Token-2022 accounts for canonical PWRC, the config references the configured vaults, the fixed reward allocation matches policy, and funded/distributed reward totals are coherent. Only then can the Solana staking configuration become executable. The web surface is fully wallet-wired for verified Solana deployments. It exposes initialize-position, stake, request-unstake, cooldown withdrawal, and reward-claim actions only after runtime verification succeeds. Every state-changing action re-checks the staking status immediately before building the wallet transaction.

Sui remains fail-closed until a real package, staking pool, reward pool, wPWRC coin type, and runtime verifier are available:

```text
POWERCHAIN_SUI_STAKING_PACKAGE_ID=
POWERCHAIN_SUI_STAKING_POOL_OBJECT_ID=
POWERCHAIN_SUI_STAKING_REWARD_POOL_OBJECT_ID=
POWERCHAIN_WPWRC_SUI_COIN_TYPE=
```

No Sui staking identifier is invented by this repository.

## Staking dashboard

`/staking` is light-first by default and supports the shared dark theme. The dark presentation follows the low-glow PowerChain reference aesthetic, while both themes use the same verified data model.

The dashboard intentionally replaces promotional or synthetic metrics with evidence-backed values:

- total staked PWRC from the verified on-chain staking config;
- reward-vault funded and available balances from the verified Token-2022 reward vault;
- configured `ppmPerEpoch` and `epochSlots` reward policy without converting it into APR/APY;
- minimum stake and cooldown slots from on-chain config;
- connected-wallet PWRC balance from the Token-2022 associated token account;
- wallet-owned staking position PDA state: active stake, pending unstake, recorded accrued rewards, current slot, and cooldown readiness.

`GET /api/v1/staking/position?wallet=<SOLANA_ADDRESS>` is read-only. It derives the position PDA from the verified program, validates program ownership, account discriminator, and wallet ownership, and fails closed across the configured RPC pool. It does not sign or construct transactions.

The client keeps that server-verified initial snapshot, then refreshes `/api/v1/staking/status` on a bounded interval and when the browser regains focus/connectivity. A failed refresh does not turn stale data into authority: the UI labels the refresh failure, and every state-changing action still performs a fresh fail-closed status check immediately before transaction construction.

Wallet balance handling distinguishes three states: a missing canonical Token-2022 associated token account is a verified zero balance; a valid account returns its RPC balance; an RPC/read failure is shown as unavailable and does not become `0 PWRC`. Stake and unstake inputs are checked against the verified minimum stake, connected-wallet balance, and active position before the wallet is opened.

Transaction submission is single-flight. If a signature is returned but confirmation cannot be established, the UI preserves the signature and reports the result as ambiguous rather than safe-to-retry. Operators/users should verify the signature before resubmitting because staking instructions are not assumed idempotent.

## Solana program

The Anchor program lives in `programs/solana/powerchain_staking/`. It provides:

- staking configuration and authority rotation;
- pause controls;
- wallet-owned stake positions;
- canonical PWRC Token-2022 stake and reward vaults;
- fixed-pool reward funding capped at the deployment-configured funded reward cap;
- on-chain reward rate expressed as integer parts-per-million per configured epoch;
- stake, unstake request, cooldown withdrawal, and reward claim instructions;
- exact token-transfer balance assertions;
- no minting, burning, inflation, backend signing, or fabricated APR.

Reward policy cannot change while principal is actively staked. This prevents an authority update from retroactively changing the rate applied to existing positions.

## Program identifier workflow

`Stake11111111111111111111111111111111111111` is an explicit compile-time development placeholder. It is not a PowerChain deployment identifier and the runtime rejects it.

Before deploying, create the real program keypair in the normal Anchor/Solana deployment environment and synchronize its public key:

```bash
pnpm staking:program-id:sync
```

The sync command reads `programs/solana/target/deploy/powerchain_staking-keypair.json` by default, updates the Rust `declare_id!`, `Anchor.toml`, and `config/staking.json`, and leaves `deploymentVerified` false. The program becomes verified only after deployment and RPC checks succeed.

Do not commit private deployment key material.

## Reward verification

The application does not convert a configured reward rate into an APR claim. After RPC verification, `/api/v1/staking/status` can expose:

- reward vault address;
- fixed allocation cap;
- total funded rewards recorded by the staking config;
- total distributed rewards recorded by the staking config;
- current reward-vault token balance;
- verified on-chain `ppmPerEpoch` and `epochSlots` values.

These values describe the deployed reward schedule without pretending that a future realized yield is guaranteed.

## Deployment sequence

1. Generate the real Solana staking program keypair outside source control.
2. Run `pnpm staking:program-id:sync`.
3. Build and deploy the Anchor program on the intended Solana cluster.
4. Initialize the staking config with the approved reward rate, epoch length, cooldown, and minimum stake.
5. Fund the reward vault from the approved fixed staking allocation source.
6. Configure the program, config PDA, stake vault, reward vault, and RPC endpoint in the server environment.
7. Call `/api/v1/staking/status` and require `deploymentEvidence.status === "verified"` and `executable === true` before enabling staking actions.
8. Run the production and dependency-aware validation gates.

## Validation

Source-level staking invariants are checked with:

```bash
pnpm staking:production:check
pnpm staking-ui:production:check
pnpm staking-runtime-ux:production:check
pnpm programs:check
pnpm monorepo-programs:production:check
pnpm verify:production
```

Dependency-backed validation additionally requires Node 24.x, pnpm 11.22.0, installed workspace dependencies, Prisma generation, and the Anchor/Rust toolchain for the program build.

## Token-2022 accounting

PWRC staking records the actual amount credited to program vaults after Token-2022 extension processing. Native transfer fees are not hidden or fabricated: deposit/funding events expose both requested and credited amounts, and withdrawals/claims expose both vault debit and recipient credit.

## Transaction recovery

After a connected wallet returns a Solana staking signature, the browser records the submission in a bounded local journal. The journal is synchronized across tabs and reconciled through `GET /api/v1/staking/transactions/:signature`, which reads Solana `getSignatureStatuses` through the configured RPC pool.

Recovery states are monotonic (`submitted` → `processed` → `confirmed` → `finalized`) with explicit `failed` and non-terminal `not_found` observations. A recently submitted signature receives a grace period before `not_found` is shown, and a lagging fallback RPC cannot downgrade a previously stronger confirmation state.

The recovery layer never rebuilds, signs, retries, or resubmits an instruction. It is operational UX only and is not authoritative reward accounting or bridge finality.
