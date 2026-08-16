"use client";

export function HistoryPagination({ page, pageSize, total, onPageChange, onPageSizeChange }: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(Math.max(0, total) / Math.max(1, pageSize)));
  const safePage = Math.min(Math.max(1, page), pages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(total, safePage * pageSize);
  return <nav aria-label="Transfer history pages" className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
    <p className="text-xs text-slate-500 dark:text-slate-400"><span className="tabular-nums">{start}–{end}</span> of <span className="tabular-nums">{total}</span> transfers</p>
    <div className="flex items-center gap-2">
      {onPageSizeChange ? <label className="mr-auto flex items-center gap-2 text-xs text-slate-500 sm:mr-2"><span>Rows</span><select aria-label="Transfers per page" value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))} className="min-h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select></label> : null}
      <button type="button" disabled={safePage <= 1} onClick={() => onPageChange(safePage - 1)} className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:border-slate-700">Previous</button>
      <span className="min-w-16 text-center text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">{safePage} / {pages}</span>
      <button type="button" disabled={safePage >= pages} onClick={() => onPageChange(safePage + 1)} className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:border-slate-700">Next</button>
    </div>
  </nav>;
}
