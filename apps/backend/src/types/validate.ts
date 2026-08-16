export type ValidationIssue = { code:string; field?:string; message:string };
export type ValidationResult<T> = { ok:true; value:T } | { ok:false; issues:ValidationIssue[] };
