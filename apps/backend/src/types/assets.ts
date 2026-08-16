import type { BlockchainChain } from "@powerchain/blockchain";
export type AssetKind = "native"|"token"|"stablecoin"|"bridged";
export type AssetDefinition = { id:string; chain:BlockchainChain; symbol:string; name:string; address:string; decimals:number; kind:AssetKind; trusted:boolean };
