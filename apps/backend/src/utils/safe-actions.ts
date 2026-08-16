import { randomUUID } from "node:crypto";import type { SafeActionResult } from "../types/actions";import { publicError } from "./errors";
export async function safeAction<T>(action:()=>Promise<T>,requestId=randomUUID()):Promise<SafeActionResult<T>>{try{return{ok:true,data:await action(),requestId}}catch(error){return{ok:false,error:publicError(error),requestId}}}
