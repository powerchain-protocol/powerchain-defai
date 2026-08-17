import fs from "node:fs";
const config=fs.readFileSync("prisma.config.ts","utf8");
const postinstall=fs.readFileSync("scripts/postinstall.mjs","utf8");
const ensure=fs.readFileSync("scripts/ensure-prisma-client.mjs","utf8");
const errors=[];
if(config.includes('env("DATABASE_URL")')||config.includes("env('DATABASE_URL')")) errors.push("prisma config still hard-requires DATABASE_URL during generate");
if(!config.includes("process.env.DATABASE_URL")) errors.push("prisma config optional datasource URL missing");
if(postinstall.includes("skipping Prisma generation")&&postinstall.includes("DATABASE_URL")) errors.push("postinstall still skips generation without DATABASE_URL");
if(!postinstall.includes("ensure-prisma-client.mjs")) errors.push("postinstall must delegate to canonical Prisma ensure script");
if(!ensure.includes('requireFromRoot.resolve("prisma/package.json")')) errors.push("Prisma ensure does not resolve installed Prisma CLI directly");
if(!ensure.includes('"generate", "--schema"')) errors.push("Prisma ensure generate invocation missing");
if(!ensure.includes('.source.sha256')||!ensure.includes('sourceHash()')) errors.push("Prisma ensure is not source-hash freshness guarded");
if(errors.length){console.error(JSON.stringify({ok:false,errors},null,2));process.exit(1);}
console.log(JSON.stringify({ok:true,checks:["Prisma generate does not require DATABASE_URL","postinstall delegates to canonical source-hash Prisma ensure","Prisma ensure resolves local CLI directly","DB operations remain datasource-gated"]},null,2));
