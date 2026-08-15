import {OperationRecord,isOperationTerminal,requiresOperationRecovery} from "./operation-journal";
export type OperationActionState={blocking:boolean;recoveryRequired:boolean;terminal:boolean;walletChanged:boolean;canStartMutation:boolean;reason?:string};
export function deriveOperationActionState(record:OperationRecord|null,currentWalletIdentity?:string):OperationActionState{
  if(!record)return{blocking:false,recoveryRequired:false,terminal:false,walletChanged:false,canStartMutation:true};
  const terminal=isOperationTerminal(record.status),walletChanged=!!record.walletIdentity&&!!currentWalletIdentity&&record.walletIdentity!==currentWalletIdentity,recoveryRequired=requiresOperationRecovery(record.status),blocking=!terminal;
  let reason:string|undefined;if(walletChanged)reason="Connected wallet changed. Check the existing operation before starting another action.";else if(recoveryRequired)reason="Existing operation requires recovery. Check its server status before starting another action.";else if(blocking)reason="Another bridge or claim operation is still active.";
  return{blocking,recoveryRequired,terminal,walletChanged,canStartMutation:!blocking&&!walletChanged,reason};
}

export function deriveExternalOperationConflictState(hasConflict:boolean){
  return hasConflict?{blocking:true,recoveryRequired:true,canStartMutation:false,reason:"Another PowerChain tab has a different active operation. Resolve one operation before starting another."}:{blocking:false,recoveryRequired:false,canStartMutation:true,reason:null};
}
