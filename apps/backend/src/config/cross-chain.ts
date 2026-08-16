function enabled(name:string,fallback:boolean){const raw=process.env[name]?.trim().toLowerCase();return raw===undefined?fallback:raw==="true"||raw==="1";}
export function crossChainProviderPolicy(){return Object.freeze({
  wormhole:{enabled:enabled("WORMHOLE_ENABLED",true),principalMovementForPwrc:true as const},
  cctp:{enabled:enabled("CCTP_ENABLED",true),scope:"supported-stablecoins-only" as const},
  layerZero:{enabled:enabled("LAYERZERO_ENABLED",false),scope:"not-a-pwrc-bridge" as const},
  relayerConfigured:Boolean(process.env.BRIDGE_RELAYER_URL?.trim()),
  operatorKeyConfigured:Boolean(process.env.BRIDGE_OPERATOR_KEY?.trim()),
  operatorKeyAcceptedAsWalletSigner:false as const,
});}
