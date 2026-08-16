import { randomUUID } from "node:crypto";
import { prisma } from "@powerchain/database/prisma";
import { canonicalSwapIntent, type SwapChain } from "@powerchain/swap-core";

function providerFor(chain:SwapChain, provider:string){const normalized=provider.toLowerCase();if(chain==="SOLANA"&&normalized!=="jupiter")throw new Error("SWAP_PROVIDER_INVALID");if(chain==="SUI"&&normalized!=="cetus")throw new Error("SWAP_PROVIDER_INVALID");return normalized==="jupiter"?"JUPITER":"CETUS" as const;}
function digest(value:string){const v=value.trim();if(v.length<20||v.length>256||!/^[A-Za-z0-9_-]+$/.test(v))throw new Error("SWAP_TRANSACTION_DIGEST_INVALID");return v;}
export async function recordSwapSubmission(input:{chain:SwapChain;provider:"jupiter"|"cetus";payer:string;inputAsset:string;outputAsset:string;inputBaseUnits:string;quotedOutputBaseUnits?:string|null;minimumOutputBaseUnits?:string|null;feeBaseUnits?:string|null;slippageBps:number;transactionDigest:string}){
 const intent=canonicalSwapIntent({chain:input.chain,payer:input.payer,inputAsset:input.inputAsset,outputAsset:input.outputAsset,amountBaseUnits:input.inputBaseUnits,slippageBps:input.slippageBps});
 const transactionDigest=digest(input.transactionDigest);const provider=providerFor(input.chain,input.provider);
 return prisma.swapExecution.upsert({where:{transactionDigest},create:{id:randomUUID(),chain:intent.chain,provider,payer:intent.payer,inputAsset:intent.inputAsset,outputAsset:intent.outputAsset,inputBaseUnits:intent.amountBaseUnits,quotedOutputBaseUnits:input.quotedOutputBaseUnits??null,minimumOutputBaseUnits:input.minimumOutputBaseUnits??null,feeBaseUnits:input.feeBaseUnits??null,slippageBps:intent.slippageBps,status:"SUBMITTED",transactionDigest,submittedAt:new Date()},update:{status:"SUBMITTED",submittedAt:new Date(),failureCode:null}});
}
