export type ActionStatus = "idle" | "pending" | "success" | "error";
export type SafeActionError = { code: string; message: string; retryable: boolean };
export type SafeActionResult<T> = { ok: true; data: T; requestId: string } | { ok: false; error: SafeActionError; requestId: string };
export type ActionContext = { requestId: string; ip?: string; wallet?: string; chain?: "SOLANA" | "SUI" };
