/**
 * Canonical Sui SDK surface for PowerChain.
 *
 * Application packages should import Sui transaction/RPC primitives from this
 * module (or directly from @mysten/sui when framework bindings require it) and
 * must not depend on the deprecated `aptos` package for any Sui workflow.
 */
export { SuiGrpcClient } from "@mysten/sui/grpc";
export { Transaction } from "@mysten/sui/transactions";
export { normalizeSuiAddress as normalizeMystenSuiAddress } from "@mysten/sui/utils";
