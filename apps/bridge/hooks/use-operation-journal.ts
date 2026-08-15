"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {
  LEGACY_OPERATION_JOURNAL_KEYS,OPERATION_JOURNAL_CHANNEL,OPERATION_JOURNAL_KEY,
  OPERATION_TERMINAL_RETENTION_MS,OperationJournalMessage,OperationRecord,OperationStatus,ServerOperationObservation,
  advanceLocalOperation,applyServerOperationObservation,isOperationTerminal,operationTerminalExpiresAt,parseOperationRecord,
} from "../lib/bridge/operation-journal";

function clearLegacyStorage(){for(const key of LEGACY_OPERATION_JOURNAL_KEYS)sessionStorage.removeItem(key);}
function clearStorage(){try{sessionStorage.removeItem(OPERATION_JOURNAL_KEY);clearLegacyStorage();}catch{}}
function writeRecord(next:OperationRecord|null){
  try{
    if(next)sessionStorage.setItem(OPERATION_JOURNAL_KEY,JSON.stringify(next));else sessionStorage.removeItem(OPERATION_JOURNAL_KEY);
    clearLegacyStorage();
  }catch{}
}
function readInitialRecord(){
  try{
    const canonical=sessionStorage.getItem(OPERATION_JOURNAL_KEY);
    const legacy=canonical?null:LEGACY_OPERATION_JOURNAL_KEYS.map(key=>sessionStorage.getItem(key)).find(Boolean)??null;
    const raw=canonical??legacy;if(!raw)return null;
    const parsed=parseOperationRecord(JSON.parse(raw));
    if(!parsed){clearStorage();return null;}
    writeRecord(parsed);return parsed;
  }catch{clearStorage();return null;}
}

export type ExternalOperationConflict={record:OperationRecord;detectedAt:string};

export function useOperationJournal(){
  const [record,setRecord]=useState<OperationRecord|null>(null);
  const [externalConflict,setExternalConflict]=useState<ExternalOperationConflict|null>(null);
  const channelRef=useRef<BroadcastChannel|null>(null);
  const recordRef=useRef<OperationRecord|null>(null);
  const conflictRef=useRef<ExternalOperationConflict|null>(null);
  useEffect(()=>{recordRef.current=record;},[record]);
  useEffect(()=>{conflictRef.current=externalConflict;},[externalConflict]);

  useEffect(()=>{
    setRecord(readInitialRecord());
    if(typeof BroadcastChannel!=="undefined"){
      const channel=new BroadcastChannel(OPERATION_JOURNAL_CHANNEL);channelRef.current=channel;
      channel.onmessage=(event)=>{
        const message=event.data as OperationJournalMessage;
        if(message?.type==="clear"){
          setRecord(current=>{if(message.id&&current&&message.id!==current.id)return current;clearStorage();return null;});return;
        }
        const incoming=parseOperationRecord(message?.type==="record"?message.record:event.data);if(!incoming)return;
        setRecord(current=>{
          if(current&&current.id!==incoming.id&&!isOperationTerminal(current.status)&&!isOperationTerminal(incoming.status)){
            setExternalConflict({record:incoming,detectedAt:new Date().toISOString()});return current;
          }
          if(current&&current.id===incoming.id&&current.revision>=incoming.revision)return current;
          if(current&&current.id!==incoming.id&&isOperationTerminal(incoming.status))return current;
          writeRecord(incoming);setExternalConflict(null);return incoming;
        });
      };
      return()=>{channel.close();channelRef.current=null;};
    }
  },[]);

  useEffect(()=>{
    if(!record||!isOperationTerminal(record.status))return;
    const expiresAt=operationTerminalExpiresAt(record);if(expiresAt===null)return;
    const delay=Math.max(0,Math.min(OPERATION_TERMINAL_RETENTION_MS,expiresAt-Date.now()));
    const timer=setTimeout(()=>{
      const current=recordRef.current;
      if(!current||current.id!==record.id||!isOperationTerminal(current.status))return;
      clearStorage();setRecord(null);channelRef.current?.postMessage({type:"clear",id:current.id,revision:current.revision} satisfies OperationJournalMessage);
    },delay);
    return()=>clearTimeout(timer);
  },[record?.id,record?.status,record?.terminalAt,record?.updatedAt]);

  const broadcast=useCallback((message:OperationJournalMessage)=>channelRef.current?.postMessage(message),[]);
  const persist=useCallback((next:OperationRecord|null)=>{setRecord(next);writeRecord(next);if(next)broadcast({type:"record",record:next});},[broadcast]);
  const begin=useCallback((next:Omit<OperationRecord,"createdAt"|"updatedAt"|"revision">)=>{
    const current=recordRef.current,conflict=conflictRef.current;
    if(current&&!isOperationTerminal(current.status))throw new Error(`OPERATION_ALREADY_ACTIVE:${current.kind}:${current.id}`);
    if(conflict&&!isOperationTerminal(conflict.record.status))throw new Error(`OPERATION_CONFLICT_ACTIVE:${conflict.record.kind}:${conflict.record.id}`);
    const now=new Date().toISOString();setExternalConflict(null);persist({...next,createdAt:now,updatedAt:now,revision:1});
  },[persist]);
  const updateStatus=useCallback((status:OperationStatus)=>{
    setRecord(current=>{if(!current)return null;const next=advanceLocalOperation(current,status);if(next===current)return current;writeRecord(next);broadcast({type:"record",record:next});return next;});
  },[broadcast]);
  const reconcile=useCallback((observation:ServerOperationObservation)=>{
    setRecord(current=>{if(!current)return null;const next=applyServerOperationObservation(current,observation);if(next===current)return current;writeRecord(next);broadcast({type:"record",record:next});return next;});
  },[broadcast]);
  const clear=useCallback(()=>{const current=recordRef.current;clearStorage();setRecord(null);setExternalConflict(null);broadcast({type:"clear",id:current?.id,revision:current?.revision});},[broadcast]);
  const dismissExternalConflict=useCallback(()=>{
    const conflict=conflictRef.current;
    if(conflict&&!isOperationTerminal(conflict.record.status))return false;
    setExternalConflict(null);return true;
  },[]);
  return {
    record,externalConflict,begin,updateStatus,reconcile,clear,dismissExternalConflict,
    hasBlockingOperation:(!!record&&!isOperationTerminal(record.status))||!!externalConflict,
  };
}
