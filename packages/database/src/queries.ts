import { randomUUID } from "node:crypto";
import { prisma } from "./prisma";
import type { WalletBalanceSnapshotInput } from "./types/db";
export async function persistWalletBalanceSnapshots(rows:readonly WalletBalanceSnapshotInput[]){
  if(!rows.length)return {count:0};
  return prisma.walletBalanceSnapshot.createMany({data:rows.map((row)=>({id:randomUUID(),...row}))});
}
export async function recentSwapExecutions(input:{wallet:string;limit?:number}){
  const limit=Math.max(1,Math.min(100,input.limit??20));
  return prisma.swapExecution.findMany({where:{payer:input.wallet},orderBy:{createdAt:"desc"},take:limit});
}
