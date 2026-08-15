export function formatRemainingDuration(ms:number|null){
  if(ms===null)return "—";
  const total=Math.max(0,Math.ceil(ms/1000));
  const minutes=Math.floor(total/60);
  const seconds=total%60;
  return `${minutes}:${String(seconds).padStart(2,"0")}`;
}
