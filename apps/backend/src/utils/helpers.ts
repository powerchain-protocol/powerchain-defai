export function asRecord(value:unknown):Record<string,unknown>|null{return value!==null&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:null}
export function asString(value:unknown){return typeof value==="string"?value:undefined}
export function asNumber(value:unknown){const n=typeof value==="number"?value:typeof value==="string"?Number(value):NaN;return Number.isFinite(n)?n:undefined}
export function compactAddress(value:string,start=6,end=4){return value.length>start+end+2?`${value.slice(0,start)}…${value.slice(-end)}`:value}
