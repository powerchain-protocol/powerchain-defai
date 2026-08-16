import { transferNeedsAttention, transferStatusLabel } from "../../lib/bridge/transfer-status";

export function TransferStatusChip({ status }: { status: string }) {
  const attention = transferNeedsAttention(status);
  const complete = status === "COMPLETED";
  const label = transferStatusLabel(status);
  return (
    <span
      className={`inline-flex min-h-6 shrink-0 items-center rounded-full px-2 py-1 text-[10px] font-bold ${
        attention
          ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
          : complete
            ? "bg-[#f1f4f2] text-[#294a3b] dark:bg-[#09110e]/60 dark:text-[#d0dcd6]"
            : "bg-[#f1f4f2] text-[#294a3b] dark:bg-[#09110e]/60 dark:text-[#d0dcd6]"
      }`}
      aria-label={`Transfer status: ${label}`}
    >
      {label}
    </span>
  );
}
