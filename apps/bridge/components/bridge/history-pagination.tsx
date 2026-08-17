"use client";
import { Pagination } from "@/components/ui/pagination";
export function HistoryPagination({ page, pageSize, total, onPageChange, onPageSizeChange }: { page:number; pageSize:number; total:number; onPageChange:(page:number)=>void; onPageSizeChange?:(pageSize:number)=>void }) {
  return <div className="border-t border-slate-200 pt-4 dark:border-slate-800"><span className="sr-only">Transfers per page</span>{onPageSizeChange ? <Pagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} label="Transfer history pages" /> : <Pagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} label="Transfer history pages" />}</div>;
}
