import "server-only";
import {createHash} from "node:crypto";

type OperationKind="bridge"|"claim";
type SnapshotInput={kind:OperationKind;id:string;status:string;revision:number;observedAt?:string};
function canonical(input:SnapshotInput){return JSON.stringify({kind:input.kind,id:input.id,status:input.status,revision:input.revision,observedAt:input.observedAt??new Date().toISOString()});}
export function createOperationStatusSnapshot(input:SnapshotInput){
  if((input.kind!=="bridge"&&input.kind!=="claim")||typeof input.id!=="string"||input.id.length<4||input.id.length>160)throw new Error("INVALID_OPERATION_STATUS_IDENTITY");
  if(!Number.isInteger(input.revision)||input.revision<0)throw new Error("INVALID_OPERATION_STATUS_REVISION");
  const payload=JSON.parse(canonical(input)) as SnapshotInput&{observedAt:string};
  const snapshotId=createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  const etag=`"${snapshotId}"`;
  return {payload:{...payload,snapshotId},snapshotId,etag,headers:{"cache-control":"no-store, max-age=0","etag":etag,"x-powerchain-operation-snapshot":snapshotId,"x-content-type-options":"nosniff"}};
}
export function operationStatusNotModified(request:Request,etag:string){return request.headers.get("if-none-match")===etag;}
export function operationStatusResponse(request:Request,input:SnapshotInput){
  const snapshot=createOperationStatusSnapshot(input);
  if(operationStatusNotModified(request,snapshot.etag))return new Response(null,{status:304,headers:snapshot.headers});
  return Response.json(snapshot.payload,{status:200,headers:snapshot.headers});
}
