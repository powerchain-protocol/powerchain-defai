export type RoutePolicyPressure = "normal" | "elevated" | "high";

export type RoutePolicyDiagnosticsPayload = Readonly<{
  available: true;
  generatedAt: string;
  processLocal: true;
  authoritativeForAccounting: false;
  routes: Readonly<{
    registered: number;
    risks: Readonly<{
      "public-read": number;
      "wallet-read": number;
      "wallet-write": number;
      operator: number;
    }>;
    rateClasses: Readonly<{
      light: number;
      standard: number;
      strict: number;
    }>;
  }>;
  limiter: Readonly<{
    bucketCount: number;
    maxBuckets: number;
    pruneInterval: number;
    utilization: number;
    pressure: RoutePolicyPressure;
  }>;
}>;
