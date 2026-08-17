# Swap, bridge, fees, and wallet safety

PowerChain 1.0.0 exposes one transaction workspace with **Swap** and **Bridge** tabs.

## Swap

Sui swaps use the Cetus Aggregator SDK. The backend requests the route and builds the transaction; the connected Sui wallet remains the signer and gas payer.

Supported swap assets are explicit configuration only. The application never invents a wPWRC, USDC, or other Sui coin type.

Swap controls include:

- slippage tolerance from 0.01% to 5%;
- a default 0.50% tolerance;
- MEV-aware price protection based on quote freshness and minimum received;
- a 2.5% PowerChain overlay fee to the configured Sui fee receiver;
- exact minimum-output protection when the wallet transaction is rebuilt;
- no gas sponsor: the connected wallet pays Sui gas and approves the signature.

The MEV protection label does **not** claim private order flow, a private relay, or sandwich-proof execution. It means the application constrains execution with a fresh route, bounded slippage, and a minimum output derived from the user-visible quote.

Before the wallet opens, Swap now uses a two-step confirmation flow. The review sheet re-displays the exact input amount, quoted output, minimum received, slippage, 2.5% fee disclosure, Cetus route, connected payer/signer, and user-paid Sui gas policy. An expired quote closes the review boundary and must be refreshed before the transaction can be prepared.

When Cetus returns an aggregator `deviationRatio`, the UI labels it as **aggregator route deviation**. It is shown as returned quote evidence only; PowerChain does not relabel it as synthetic price impact or infer a value when the provider does not supply one.

## Bridge

Bridge principal continues to move only through Wormhole NTT. The PowerChain auxiliary programs are authority/configuration/audit boundaries and are not a second settlement bridge.

The default product direction is Sui wPWRC to Solana PWRC, with the reverse route available when the configured NTT deployment supports it.

## PWRC 2.5% Token-2022 transfer fee

On Solana, PWRC fee enforcement is based on the Token-2022 Transfer Fee extension when `POWERCHAIN_SOLANA_PWRC_FEE_MODE=service-fee-separate`.

Required configuration:

```text
POWERCHAIN_PWRC_TRANSFER_FEE_BPS=0
POWERCHAIN_PWRC_WITHDRAW_WITHHELD_AUTHORITY=
POWERCHAIN_PWRC_FEE_RECEIVER_TOKEN_ACCOUNT=
```

The runtime verifies the mint's on-chain transfer-fee configuration. Standard Token-2022 harvest and withdraw instructions are available to an authorized treasury/operator workflow; the application never embeds the withdraw authority private key.

Native Token-2022 transfer fees are withheld by the token program. They must not be combined with a second 2.5% Solana source service-fee policy for the same transfer. When native mode is enabled, configure the separate Solana bridge service-fee policy at zero to avoid double charging.

Sui assets are not Token-2022. The 2.5% Sui swap charge is therefore implemented as the configured Cetus overlay fee and is disclosed separately from Solana's native Token-2022 fee mechanism.

## Payer and signature rules

All transaction preparation is bound to the connected wallet address.

The backend/client payer guards reject a requested payer that does not match the connected wallet. Swap transactions set the Sui sender to that payer and are returned unsigned. The connected wallet signs and executes the transaction.

The policy is:

```text
payer = connected wallet
network fees = paid by connected wallet
sponsored gas = false
user signature = required
```

Server code never receives a seed phrase or private signing key.

## APIs

```text
POST /api/v1/swap/quote
POST /api/v1/swap/transaction
GET  /api/v1/fees/token-2022
```

The transaction endpoint re-quotes server-side and rejects execution when the fresh route output falls below the minimum output bound from the user's prior quote.

## Source-balance preflight

Before a quote can move to wallet review, the Swap workspace reads the connected Sui account's configured source-asset balance through `GET /api/v1/swap/balance`. The API maps only configured Swap asset IDs to coin types and never accepts an arbitrary coin type from the browser.

The same balance invariant is enforced again inside the server-side Cetus quote path. A request fails with `SWAP_INSUFFICIENT_BALANCE` when the source-token balance is too small. When SUI is the source asset, swapping the complete SUI balance fails with `SWAP_SUI_GAS_RESERVE_REQUIRED`; the application does not guess a fixed gas reserve.

For wPWRC and configured USDC, the UI can safely expose an exact **Max** action because Sui gas is paid separately in SUI. For SUI itself, the UI shows the available balance but intentionally omits Max so the user retains control over how much SUI to reserve for gas. The wallet remains the final transaction signer and gas payer.

The review sheet is locked against backdrop, Escape, and close/back dismissal while an active wallet-signature request is being opened. After submission, the UI exposes the transaction digest through the Sui explorer and explicitly distinguishes transaction submission from authoritative bridge/accounting finality.
