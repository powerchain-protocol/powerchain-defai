import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const prismaDir=path.join(root,"prisma/migrations");
const supabaseDir=path.join(root,"supabase/migrations");
const prisma=fs.readdirSync(prismaDir,{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>x.name).sort();
const supabase=fs.readdirSync(supabaseDir).filter(x=>x.endsWith(".sql")).map(x=>x.replace(/\.sql$/,"" )).sort();
const missingSupabase=prisma.filter(x=>!supabase.includes(x));
const missingPrisma=supabase.filter(x=>!prisma.includes(x));
if(missingSupabase.length||missingPrisma.length) throw new Error(`Migration parity failed. Missing Supabase: ${missingSupabase.join(",")||"none"}; missing Prisma: ${missingPrisma.join(",")||"none"}`);
for(const name of prisma){
  const prismaPath=path.join(prismaDir,name,"migration.sql");
  const supabasePath=path.join(supabaseDir,`${name}.sql`);
  if(!fs.existsSync(prismaPath)||!fs.readFileSync(prismaPath,"utf8").trim()) throw new Error(`Missing/empty Prisma migration: ${name}`);
  if(!fs.existsSync(supabasePath)||!fs.readFileSync(supabasePath,"utf8").trim()) throw new Error(`Missing/empty Supabase migration: ${name}`);
  const prismaSql=fs.readFileSync(prismaPath,"utf8");
  const supabaseSql=fs.readFileSync(supabasePath,"utf8");
  if(prismaSql!==supabaseSql) throw new Error(`Migration bytes differ between Prisma and Supabase: ${name}`);
}
console.log(`migration-check: PASS (${prisma.length} byte-identical mirrored migrations)`);
