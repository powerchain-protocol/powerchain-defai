function bounded(name:string,fallback:number,min:number,max:number){const raw=Number(process.env[name]??fallback);return Number.isFinite(raw)?Math.max(min,Math.min(max,Math.floor(raw))):fallback;}
export function realtimePolicy(){return Object.freeze({
  enabled: (process.env.ENABLE_WEBSOCKETS??"true").trim().toLowerCase()!=="false",
  reconnectIntervalMs: bounded("WS_RECONNECT_INTERVAL",5000,1000,60000),
  heartbeatIntervalMs: bounded("WS_HEARTBEAT_INTERVAL",30000,5000,120000),
});}
