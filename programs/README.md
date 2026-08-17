# Solana Programs

PowerChain Anchor programs live under `programs/solana/`. Program source configuration is not proof of deployment; production status must be verified on the intended Solana cluster.

## PowerChain Bridge auxiliary program

Configured source program ID:

```text
BGEekuKBEsKzEdUdEKvWn4BGRgvAURQMD9f4yLLRteWS
```

The Bridge auxiliary program provides governed configuration and audit controls: authority rotation, pause state, nonce management, intent validation, and the token information commitment. It does **not** mint, burn, custody, lock, unlock, or settle PWRC/wPWRC principal. Wormhole NTT remains the sole cross-chain principal-movement protocol.

Configure the governed signer with `POWERCHAIN_SOLANA_BRIDGE_AUTHORITY`; never set it to the program ID.

## PowerChain Staking program

`powerchain_staking` implements deployment-gated PWRC Token-2022 fixed-pool staking. It provides wallet-owned stake positions, stake/reward vaults, pause and authority controls, cooldown withdrawals, funded reward claims, and an on-chain integer reward policy.

The staking program:

- pins canonical PWRC as the staking/reward mint;
- caps reward funding at the positive allocation cap stored in the deployed, RPC-verified staking configuration;
- never mints reward tokens or creates inflation;
- requires connected-wallet signatures for user staking actions;
- prevents reward-policy changes while active principal is staked;
- records actual Token-2022 amounts credited/received so transfer-fee behavior cannot inflate accounting;
- exposes no fabricated APR.

The source initially uses the explicit non-production placeholder `Stake11111111111111111111111111111111111111` so the program can compile before deployment key material exists. The application and production verification logic reject that value as a live deployment. Generate the real program keypair and run `pnpm staking:program-id:sync` before deployment.

See [`../docs/STAKING.md`](../docs/STAKING.md), [`../docs/BRIDGE_AUTHORITY.md`](../docs/BRIDGE_AUTHORITY.md), and [`../docs/REAL_NTT_BRIDGE.md`](../docs/REAL_NTT_BRIDGE.md).

## PowerChain Escrow program

`powerchain_escrow` is a configurable, receipt-based Solana token escrow. The source program ID is a **deployment candidate only** until RPC verification proves an executable deployment and expected configuration.

The program derives the user-requested accounts with these canonical seeds:

- `Escrow`: `["escrow", escrow_seed]`
- `Receipt`: `["receipt", escrow, depositor, mint, receipt_seed]`
- `AllowedMint`: `["allowed_mint", escrow, mint]`
- `EscrowExtensions`: `["extensions", escrow]`
- token vault: `["vault", escrow, mint]`

Admins allowlist mints and may configure a timelock, Token-2022 extension blocks, and one external hook program. Hook callbacks run at `PreDeposit`, `PostDeposit`, `PreWithdraw`, and `PostWithdraw`. **If the escrow is made immutable, the configured hook and extension policy become permanent. A broken or malicious hook can therefore permanently block deposits or withdrawals.** Hook CPI accounts preserve requested read/write access but deliberately strip signer privileges; an external hook never receives the depositor/admin signer bit through `remaining_accounts`.

Depositors sign their own deposit/withdraw instructions. The backend only validates configuration and builds checkout/escrow plans; it never receives wallet signing keys. Token-2022 deposits record the actual amount credited to the escrow vault rather than assuming the requested amount survived transfer extensions or fees.

See [`../docs/ESCROW.md`](../docs/ESCROW.md).

## Runtime program inventory

The Bridge application exposes a read-only `/protocol` workspace backed by `GET /api/v1/programs/readiness`. Program source identifiers are displayed separately from operator configuration and RPC verification; source presence never proves a live deployment.

The Solana auxiliary Bridge Guard now asserts `BridgeConfig.version` before authority updates, pause changes, information-commitment initialization, and intent recording. Staking and escrow retain their own version/account verification rules and deployment gates.

The source inventory marks the Solana Bridge Guard as core-required and records its canonical configuration schema version. Runtime readiness still requires executable-account RPC evidence; the source ID alone is not deployment proof.
