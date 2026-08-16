function boundedSeconds(name:string,fallback:number,min:number,max:number){const raw=Number(process.env[name]??fallback);return Number.isFinite(raw)?Math.max(min,Math.min(max,Math.floor(raw))):fallback;}
export function cachePolicy(){return Object.freeze({
  quotesMs: boundedSeconds("CACHE_TTL_QUOTES",5,1,60)*1000,
  pricesMs: boundedSeconds("CACHE_TTL_PRICES",10,1,300)*1000,
  marketsMs: boundedSeconds("CACHE_TTL_MARKETS",30,1,600)*1000,
  tokensMs: boundedSeconds("CACHE_TTL_TOKENS",3600,60,86400)*1000,
});}
