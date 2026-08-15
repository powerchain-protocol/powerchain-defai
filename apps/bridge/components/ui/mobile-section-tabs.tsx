"use client";

import { useRef, type KeyboardEvent } from "react";

export type MobileSectionTab = { href: string; label: string; active?: boolean };
export function MobileSectionTabs({ items }: { items: readonly MobileSectionTab[] }) {
  const refs = useRef<Array<HTMLAnchorElement | null>>([]);
  function onKeyDown(event: KeyboardEvent<HTMLAnchorElement>, index: number) {
    if (!items.length || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let next = index;
    if (event.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
    if (event.key === "ArrowRight") next = (index + 1) % items.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = items.length - 1;
    refs.current[next]?.focus();
    refs.current[next]?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
  }
  return <nav aria-label="Bridge sections" className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:hidden"><div className="flex w-max gap-2" role="list">{items.map((item, index) => <a key={item.href} ref={(node) => { refs.current[index] = node; }} href={item.href} onKeyDown={(event) => onKeyDown(event, index)} aria-current={item.active ? "page" : undefined} className={`inline-flex min-h-10 items-center rounded-full border px-3 text-xs font-semibold whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 motion-reduce:transition-none ${item.active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"}`}>{item.label}</a>)}</div></nav>;
}
