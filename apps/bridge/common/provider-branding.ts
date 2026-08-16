export type ProviderBrand={id:string;name:string;chain:"SOLANA"|"SUI"|"MULTICHAIN"|"OFFCHAIN";website:string;logo:string};
export const PROVIDER_BRANDS:Record<string,ProviderBrand>=Object.freeze({
 jupiter:{id:"jupiter",name:"Jupiter",chain:"SOLANA",website:"https://jup.ag",logo:"https://jup.ag/favicon.ico"},
 raydium:{id:"raydium",name:"Raydium",chain:"SOLANA",website:"https://raydium.io",logo:"https://raydium.io/favicon.ico"},
 meteora:{id:"meteora",name:"Meteora",chain:"SOLANA",website:"https://meteora.ag",logo:"https://meteora.ag/favicon.ico"},
 orca:{id:"orca",name:"Orca",chain:"SOLANA",website:"https://www.orca.so",logo:"https://www.orca.so/favicon.ico"},
 cetus:{id:"cetus",name:"Cetus",chain:"SUI",website:"https://www.cetus.zone",logo:"https://www.cetus.zone/favicon.ico"},
 helius:{id:"helius",name:"Helius",chain:"SOLANA",website:"https://www.helius.dev",logo:"https://www.helius.dev/favicon.ico"},
 birdeye:{id:"birdeye",name:"Birdeye",chain:"MULTICHAIN",website:"https://birdeye.so",logo:"https://birdeye.so/favicon.ico"},
 dexscreener:{id:"dexscreener",name:"DEX Screener",chain:"MULTICHAIN",website:"https://dexscreener.com",logo:"https://dexscreener.com/favicon.ico"},
 coinmarketcap:{id:"coinmarketcap",name:"CoinMarketCap",chain:"OFFCHAIN",website:"https://coinmarketcap.com",logo:"https://coinmarketcap.com/favicon.ico"},
 tensor:{id:"tensor",name:"Tensor",chain:"SOLANA",website:"https://www.tensor.trade",logo:"https://www.tensor.trade/favicon.ico"}
});
