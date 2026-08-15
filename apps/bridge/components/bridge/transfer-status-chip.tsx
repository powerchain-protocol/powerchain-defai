import { transferNeedsAttention, transferStatusLabel } from "../../lib/bridge/transfer-status";

export function TransferStatusChip({ status }: { status: string }) {
  const attention = transferNeedsAttention(status);
  const complete = status === "COMPLETED";
  const label = transferStatusLabel(status);
  return (
    <span
      className={`inline-flex min-h-6 shrink-0 items-center rounded-full px-2 py-1 text-[10px] font-bold ${
        attention
          ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
          : complete
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
            : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
      }`}
      aria-label={`Transfer status: ${label}`}
    >
      {label}
    </span>
  );
}
