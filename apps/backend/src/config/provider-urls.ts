function clean(value:string|undefined){return value?.trim().replace(/\/+$/,"")||undefined;}
export function providerUrls(env:NodeJS.ProcessEnv=process.env){
  const jupiterV2=clean(env.POWERCHAIN_JUPITER_API_URL)||"https://api.jup.ag/swap/v2";
  return Object.freeze({
    jupiterV2,
    jupiterLegacyQuote:clean(env.JUPITER_API_URL)||"https://quote-api.jup.ag/v6",
    jupiterLegacySwap:clean(env.JUPITER_SWAP_API)||"https://quote-api.jup.ag/v6/swap",
    jupiterLegacyPrice:clean(env.JUPITER_PRICE_API)||"https://price.jup.ag/v4",
    jupiterTokenList:clean(env.JUPITER_TOKEN_LIST)||"https://token.jup.ag/all",
    raydium:clean(env.POWERCHAIN_RAYDIUM_API_URL)||clean(env.RAYDIUM_API)||"https://api-v3.raydium.io",
    birdeye:clean(env.POWERCHAIN_BIRDEYE_API_URL)||clean(env.BIRDEYE_API_URL)||"https://public-api.birdeye.so",
    coingeckoPro:clean(env.COINGECKO_API_URL)||"https://pro-api.coingecko.com/api/v3",
    coingeckoPublic:clean(env.COINGECKO_PUBLIC_API)||"https://api.coingecko.com/api/v3",
    coinmarketcap:clean(env.POWERCHAIN_COINMARKETCAP_API_URL)||clean(env.CMC_API_URL)||"https://pro-api.coinmarketcap.com",
    pythHermes:clean(env.POWERCHAIN_PYTH_HERMES_URL)||clean(env.PYTH_PRICE_SERVICE)||clean(env.PYTH_HERMES_URL)||"https://pyth.dourolabs.app/hermes",
  });
}
