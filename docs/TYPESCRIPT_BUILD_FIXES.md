# TypeScript and build-error hardening

This pass removes the TypeScript 6 `baseUrl` deprecation instead of suppressing it.
Path aliases use explicit relative path targets and all server workspaces declare Node ambient types.

## Client and server boundaries

Interactive React entry points must begin with `"use client"` when they use hooks or browser APIs.
Server data/service modules use `import "server-only"` so accidental client imports fail at build time.

`"use server"` is reserved for actual React Server Functions. API route handlers and ordinary server services are already server modules and must not be marked as Server Functions merely to silence editor errors.

## Required direct dependencies

The Bridge app directly declares `next`, `server-only`, `@solana/web3.js`, `bs58`, `tweetnacl`, and `@mysten/sui`, plus `@types/node` as a development dependency.

The Solana claim proof path uses:

```ts
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";
```

## Sui SDK v2

Do not import `SuiClient` from `@mysten/sui/client`. The v2 SDK removed that export. JSON-RPC compatibility code uses `SuiJsonRpcClient` from `@mysten/sui/jsonRpc` with an explicit network.

## Validation

Run:

```bash
pnpm type-hygiene:production:check
pnpm syntax:check
pnpm typecheck
pnpm build
```

`pnpm typecheck` and `pnpm build` require installed workspace dependencies and a generated Prisma client.
