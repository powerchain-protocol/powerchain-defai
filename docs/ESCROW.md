# PowerChain Solana Escrow

`powerchain_escrow` is a deployment-gated Anchor program for receipt-based SPL / Token-2022 custody. The connected wallet remains the depositor and withdrawal signing authority; the backend never receives a private key or signs escrow instructions.

## PDA model

| Account | Seeds | Purpose |
| --- | --- | --- |
| Escrow | `["escrow", escrow_seed]` | Admin, immutability and canonical escrow identity |
| Receipt | `["receipt", escrow, depositor, mint, receipt_seed]` | Unique deposit record, credited principal and unlock slot |
| AllowedMint | `["allowed_mint", escrow, mint]` | Per-escrow mint allowlist marker |
| EscrowExtensions | `["extensions", escrow]` | Timelock, hook program and blocked Token-2022 extensions |
| Vault | `["vault", escrow, mint]` | Program-controlled token vault |

## Workflow

1. Admin creates an escrow and extension policy.
2. Admin allowlists individual mints.
3. Depositor signs `deposit`; a unique receipt PDA is created. The receipt records the actual amount credited after Token-2022 extension processing.
4. Optional `PreDeposit` / `PostDeposit` hook callbacks execute and may reject the instruction.
5. After the configured slot timelock, the receipt owner signs `withdraw`.
6. Optional `PreWithdraw` / `PostWithdraw` hooks execute and may reject the instruction; successful withdrawal marks the receipt redeemed.

## Token-2022 extension policy

The escrow can block `PermanentDelegate`, `NonTransferable`, `Pausable`, and `TransferHook` mint extensions. Solana documents these as Token-2022 extensions with materially different transfer/authority behavior. The policy is enforced on-chain before deposit. Transfer fees are handled by recording actual credited amounts rather than fabricating fee-free principal.

## Hook warning

If an escrow is made immutable while a hook program is configured, that hook is permanent. It cannot be changed or removed afterward. The hook is called at all four hook points, and any hook error aborts the escrow instruction. A buggy or malicious permanent hook can therefore permanently block deposits and/or withdrawals. Treat hook code review and deployment verification as security-critical.

## Deployment and checkout verification

The source program ID is a development placeholder. `POWERCHAIN_SOLANA_ESCROW_PROGRAM_ID` must contain a separately deployed program; configuration alone never marks it verified. `/api/v1/escrow/readiness` checks the configured Solana program account through the server RPC pool and only reports executable when that account exists and is executable. The endpoint index is evidence metadata only; provider URLs and credentials are never returned.

Escrow checkout performs a stricter target-specific verification before returning a wallet plan. On one consistent RPC endpoint it verifies the executable program, the program-owned `Escrow`, `AllowedMint`, and `EscrowExtensions` accounts, the escrow PDA seed, account version `1`, the exact escrow/mint relationships, `AllowedMint.allowed = true`, and that the mint is owned by the SPL Token or Token-2022 program. The response derives the allowed-mint, extensions, vault, and receipt PDAs and records a verification timestamp. A failed or unavailable check returns fail-closed and no escrow plan is emitted.

Solana Pay remains a separate wallet-signed payment rail. Neither readiness nor checkout verification authorizes a backend signer: the connected wallet remains the only depositor/withdrawal signing authority.

## Hook signer boundary

External hook CPIs never receive signer privilege forwarded from `remaining_accounts`. The hook can inspect/mutate only the accounts intentionally supplied with their read/write flags, but the depositor/admin wallet signature is not delegated to the hook program. This reduces the authority available to a configured hook while preserving fail-closed hook rejection semantics.
