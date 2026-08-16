export type PowerChainFeature = "ai" | "swap" | "bridge" | "crossChain" | "limitOrders" | "webSockets";
function bool(name:string, fallback:boolean){const value=process.env[name]?.trim().toLowerCase();return value===undefined?fallback:value==="true"||value==="1"||value==="yes";}
export function featureFlags(){const limitOrdersRequested=bool("ENABLE_LIMIT_ORDERS",false);return Object.freeze({
  ai: bool("ENABLE_AI", true),
  swap: bool("ENABLE_SWAP", true),
  bridge: bool("ENABLE_BRIDGE", true),
  crossChain: bool("ENABLE_CROSS_CHAIN", true),
  limitOrders: false as const,
  limitOrdersRequested,
  limitOrdersAvailable: false as const,
  webSockets: bool("ENABLE_WEBSOCKETS", true),
});}
export function assertFeatureEnabled(feature:PowerChainFeature){const flags=featureFlags();if(feature==="limitOrders")throw new Error("FEATURE_LIMIT_ORDERS_NOT_IMPLEMENTED");if(!flags[feature])throw new Error(`FEATURE_${feature.replace(/[A-Z]/g,m=>`_${m}`).toUpperCase()}_DISABLED`);}
