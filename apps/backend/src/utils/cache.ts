type Entry<T>={value:T;expiresAt:number};const memory=new Map<string,Entry<unknown>>();
export async function cached<T>(key:string,ttlMs:number,loader:()=>Promise<T>):Promise<T>{const hit=memory.get(key) as Entry<T>|undefined;if(hit&&hit.expiresAt>Date.now())return hit.value;const value=await loader();memory.set(key,{value,expiresAt:Date.now()+Math.max(1_000,ttlMs)});return value}
export function invalidateCache(prefix:string){for(const key of memory.keys())if(key.startsWith(prefix))memory.delete(key)}
