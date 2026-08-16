import { fetchIntegrationJson } from "../http";
import { providerUrls } from "../../config/provider-urls";
const DEFAULT="https://api.jup.ag/swap/v2";
function base(){return process.env.POWERCHAIN_JUPITER_API_URL?.trim().replace(/\/+$/,"")||DEFAULT}
function headers(){const key=process.env.JUPITER_API_KEY?.trim()||process.env.POWERCHAIN_JUPITER_API_KEY?.trim();if(!key)throw new Error("JUPITER_API_KEY_REQUIRED");return{"x-api-key":key}}
export async function fetchJupiterOrder(input:{inputMint:string;outputMint:string;amountBaseUnits:string;taker:string;slippageBps:number}){const url=new URL(`${base()}/order`);url.searchParams.set("inputMint",input.inputMint);url.searchParams.set("outputMint",input.outputMint);url.searchParams.set("amount",input.amountBaseUnits);url.searchParams.set("taker",input.taker);url.searchParams.set("slippageBps",String(input.slippageBps));return fetchIntegrationJson<unknown>(url.toString(),{headers:headers()});}
export function jupiterIntegrationStatus(){const urls=providerUrls();return{provider:"jupiter" as const,chain:"solana" as const,apiUrl:base(),apiKeyConfigured:Boolean(process.env.JUPITER_API_KEY?.trim()||process.env.POWERCHAIN_JUPITER_API_KEY?.trim()),swapV2:true,legacy:{quote:urls.jupiterLegacyQuote,swap:urls.jupiterLegacySwap,price:urls.jupiterLegacyPrice,tokenList:urls.jupiterTokenList},legacyExecutionEnabled:false as const};}
