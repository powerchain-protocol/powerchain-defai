import "server-only";
import { prisma } from "@powerchain/database";
import type { BridgeMetricsPayload } from "../../lib/data/data";

const ACTIVE_STATUSES = [
  "CREATED",
  "SOURCE_SUBMITTING",
  "SOURCE_SUBMITTED",
  "SOURCE_FINALIZED",
  "MESSAGE_OBSERVED",
  "DESTINATION_SUBMITTED",
  "DESTINATION_FINALIZED",
  "RECONCILIATION_REQUIRED",
] as const;

const MAX_TIMING_SAMPLE_SIZE = 500;

function boundedWindowHours(value: number | undefined): number {
  if (!Number.isFinite(value)) return 24;
  return Math.max(1, Math.min(24 * 30, Math.trunc(value ?? 24)));
}

function decimalBaseUnits(value: { toFixed(fractionDigits?: number): string } | null | undefined): string {
  return value ? value.toFixed(0) : "0";
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[middle - 1]! + sorted[middle]!) / 2) : sorted[middle]!;
}

function durationMs(start: Date | null | undefined, end: Date | null | undefined): number | null {
  if (!start || !end) return null;
  const value = end.getTime() - start.getTime();
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function durationStats(values: Array<number | null>): { sampleSize: number; averageMs: number | null; medianMs: number | null } {
  const valid = values.filter((value): value is number => value !== null && Number.isFinite(value) && value >= 0);
  return {
    sampleSize: valid.length,
    averageMs: valid.length > 0 ? Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length) : null,
    medianMs: median(valid),
  };
}

export async function getBridgeMetrics(input: { windowHours?: number } = {}): Promise<BridgeMetricsPayload> {
  const windowHours = boundedWindowHours(input.windowHours);
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1_000);

  const [
    total,
    active,
    completed,
    failed,
    reconciliationRequired,
    createdInWindow,
    completedInWindow,
    suiToSolanaInWindow,
    solanaToSuiInWindow,
    suiToSolana,
    solanaToSui,
    completedPrincipal,
    completedPrincipalInWindow,
    timingRows,
  ] = await Promise.all([
    prisma.bridgeTransfer.count(),
    prisma.bridgeTransfer.count({ where: { status: { in: [...ACTIVE_STATUSES] } } }),
    prisma.bridgeTransfer.count({ where: { status: "COMPLETED" } }),
    prisma.bridgeTransfer.count({ where: { status: "FAILED" } }),
    prisma.bridgeTransfer.count({ where: { status: "RECONCILIATION_REQUIRED" } }),
    prisma.bridgeTransfer.count({ where: { createdAt: { gte: since } } }),
    prisma.bridgeTransfer.count({ where: { status: "COMPLETED", updatedAt: { gte: since } } }),
    prisma.bridgeTransfer.count({ where: { direction: "SUI_TO_SOLANA", createdAt: { gte: since } } }),
    prisma.bridgeTransfer.count({ where: { direction: "SOLANA_TO_SUI", createdAt: { gte: since } } }),
    prisma.bridgeTransfer.aggregate({ where: { direction: "SUI_TO_SOLANA" }, _sum: { principalBaseUnits: true } }),
    prisma.bridgeTransfer.aggregate({ where: { direction: "SOLANA_TO_SUI" }, _sum: { principalBaseUnits: true } }),
    prisma.bridgeTransfer.aggregate({ where: { status: "COMPLETED" }, _sum: { principalBaseUnits: true } }),
    prisma.bridgeTransfer.aggregate({ where: { status: "COMPLETED", updatedAt: { gte: since } }, _sum: { principalBaseUnits: true } }),
    prisma.bridgeTransfer.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: MAX_TIMING_SAMPLE_SIZE,
      select: {
        status: true,
        createdAt: true,
        updatedAt: true,
        sourceVerifiedAt: true,
        messageObservedAt: true,
        destinationVerifiedAt: true,
      },
    }),
  ]);

  const terminal = completed + failed;
  const completedOperationDurations = timingRows
    .filter((row) => row.status === "COMPLETED")
    .map((row) => durationMs(row.createdAt, row.updatedAt));
  const operation = durationStats(completedOperationDurations);
  const sourceFinality = durationStats(timingRows.map((row) => durationMs(row.createdAt, row.sourceVerifiedAt)));
  const messageObservation = durationStats(timingRows.map((row) => durationMs(row.sourceVerifiedAt, row.messageObservedAt)));
  const destinationFinality = durationStats(timingRows.map((row) => durationMs(row.messageObservedAt, row.destinationVerifiedAt)));

  return {
    generatedAt: new Date().toISOString(),
    windowHours,
    authoritativeForBridgeAccounting: false,
    source: "persisted-bridge-database",
    transfers: {
      total,
      active,
      completed,
      failed,
      reconciliationRequired,
      createdInWindow,
      completedInWindow,
      suiToSolanaInWindow,
      solanaToSuiInWindow,
      terminalCompletionRateBps: terminal > 0 ? Math.round((completed * 10_000) / terminal) : null,
    },
    principal: {
      suiToSolanaBaseUnits: decimalBaseUnits(suiToSolana._sum.principalBaseUnits),
      solanaToSuiBaseUnits: decimalBaseUnits(solanaToSui._sum.principalBaseUnits),
      completedBaseUnits: decimalBaseUnits(completedPrincipal._sum.principalBaseUnits),
      completedInWindowBaseUnits: decimalBaseUnits(completedPrincipalInWindow._sum.principalBaseUnits),
    },
    timing: {
      completedSampleSize: operation.sampleSize,
      averageOperationDurationMs: operation.averageMs,
      medianOperationDurationMs: operation.medianMs,
      sourceFinality: {
        sampleSize: sourceFinality.sampleSize,
        averageMs: sourceFinality.averageMs,
        medianMs: sourceFinality.medianMs,
      },
      messageObservation: {
        sampleSize: messageObservation.sampleSize,
        averageMs: messageObservation.averageMs,
        medianMs: messageObservation.medianMs,
      },
      destinationFinality: {
        sampleSize: destinationFinality.sampleSize,
        averageMs: destinationFinality.averageMs,
        medianMs: destinationFinality.medianMs,
      },
    },
  };
}
