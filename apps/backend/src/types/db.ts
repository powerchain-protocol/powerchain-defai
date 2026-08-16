export type DatabaseConsistency = "primary" | "analytics";
export type DatabaseSnapshotMeta = { observedAt:string; source:string; consistency:DatabaseConsistency; authoritativeForBridgeAccounting:boolean };
export type QueryPage<T> = { items:T[]; nextCursor:string|null; hasMore:boolean };
