export class PowerChainError extends Error { constructor(public readonly code:string,message=code,public readonly retryable=false){super(message);this.name="PowerChainError"} }
export function errorCode(error:unknown){return error instanceof PowerChainError?error.code:error instanceof Error?error.message:"UNKNOWN_ERROR"}
export function publicError(error:unknown){const code=errorCode(error);return{code,message:code.replaceAll("_"," ").toLowerCase(),retryable:/TIMEOUT|UNAVAILABLE|RATE_LIMIT/.test(code)}}
