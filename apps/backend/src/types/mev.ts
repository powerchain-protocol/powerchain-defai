export type MevProtectionMode = "standard" | "protected";
export type MevProtection = { mode: MevProtectionMode; slippageBps: number; minimumOutBaseUnits?: string; privateRelay: false };
