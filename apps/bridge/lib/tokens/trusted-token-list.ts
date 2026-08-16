export type SwapChain = "SOLANA" | "SUI";
export type TrustedToken = { id:string; chain:SwapChain; symbol:string; name:string; decimals:number; address:string; native:boolean; tokenProgram?:string; icon?:string; swapEnabled:boolean; poolDiscoveryEnabled:boolean; informationCommitment?:string };
export const FALLBACK_TRUSTED_TOKENS: readonly TrustedToken[] = Object.freeze([
  {id:"solana:sol",chain:"SOLANA",symbol:"SOL",name:"Solana",decimals:9,address:"So11111111111111111111111111111111111111112",native:true,tokenProgram:"native",swapEnabled:true,poolDiscoveryEnabled:true},
  {id:"solana:usdc",chain:"SOLANA",symbol:"USDC",name:"USD Coin",decimals:6,address:"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",native:false,tokenProgram:"spl-token",swapEnabled:true,poolDiscoveryEnabled:true},
  {id:"solana:eurc",chain:"SOLANA",symbol:"EURC",name:"EURC",decimals:6,address:"HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr",native:false,tokenProgram:"spl-token",swapEnabled:true,poolDiscoveryEnabled:true},
  {id:"sui:sui",chain:"SUI",symbol:"SUI",name:"Sui",decimals:9,address:"0x2::sui::SUI",native:true,tokenProgram:"sui-coin",swapEnabled:true,poolDiscoveryEnabled:true},
  {id:"sui:usdc",chain:"SUI",symbol:"USDC",name:"USD Coin",decimals:6,address:"0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",native:false,tokenProgram:"sui-coin",swapEnabled:true,poolDiscoveryEnabled:true},
]);
export function tokensForChain(tokens:readonly TrustedToken[],chain:SwapChain){return tokens.filter(token=>token.chain===chain&&token.swapEnabled)}
export function formatTokenAmount(baseUnits:string|undefined,decimals:number,maxFraction=6){if(!baseUnits||!/^\d+$/.test(baseUnits))return"0";const value=BigInt(baseUnits),scale=10n**BigInt(decimals),whole=value/scale,fraction=(value%scale).toString().padStart(decimals,"0").slice(0,maxFraction).replace(/0+$/,"");return fraction?`${whole}.${fraction}`:whole.toString()}
export function toTokenBaseUnits(value:string,decimals:number):string|null{if(!/^\d*(?:\.\d*)?$/.test(value)||!value||value===".")return null;const [whole="0",fraction=""]=value.split(".");if(fraction.length>decimals)return null;return (BigInt(whole||"0")*10n**BigInt(decimals)+BigInt((fraction+"0".repeat(decimals)).slice(0,decimals)||"0")).toString()}
