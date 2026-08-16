export type DefaiChartKind = "allocation" | "value-history" | "pool-liquidity" | "staking-rewards";

export interface DefaiChartPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface DefaiChartModel {
  kind: DefaiChartKind;
  title: string;
  unit?: string;
  points: readonly DefaiChartPoint[];
  source: "portfolio" | "market-data" | "pool-data" | "staking-data";
  authoritativeForSettlement: false;
}

export function createDefaiChart(input: Omit<DefaiChartModel, "authoritativeForSettlement">): DefaiChartModel {
  return { ...input, authoritativeForSettlement: false };
}
