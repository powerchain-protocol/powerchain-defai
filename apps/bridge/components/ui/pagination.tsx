import { Button } from "./button";
import { Select } from "./select";

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange, pageSizes = [25, 50, 100], label = "Pagination" }: { page: number; pageSize: number; total: number; onPageChange: (page: number) => void; onPageSizeChange?: (size: number) => void; pageSizes?: readonly number[]; label?: string }) {
  const pages = Math.max(1, Math.ceil(Math.max(0, total) / Math.max(1, pageSize)));
  const safe = Math.min(Math.max(1, page), pages);
  const start = total === 0 ? 0 : (safe - 1) * pageSize + 1;
  const end = Math.min(total, safe * pageSize);
  return (
    <nav aria-label={label} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500"><span className="tabular-nums">{start}–{end}</span> of <span className="tabular-nums">{total}</span></p>
      <div className="flex items-center gap-2">
        {onPageSizeChange ? <label className="flex items-center gap-2 text-xs text-slate-500"><span>Rows</span><Select aria-label="Rows per page" value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))} className="min-h-9 py-1 text-xs">{pageSizes.map((size) => <option key={size} value={size}>{size}</option>)}</Select></label> : null}
        <Button size="sm" disabled={safe <= 1} onClick={() => onPageChange(safe - 1)}>Previous</Button>
        <span className="min-w-16 text-center text-xs font-semibold tabular-nums" aria-live="polite">{safe} / {pages}</span>
        <Button size="sm" disabled={safe >= pages} onClick={() => onPageChange(safe + 1)}>Next</Button>
      </div>
    </nav>
  );
}
