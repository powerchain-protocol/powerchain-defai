"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { CheckIcon, ChevronDownIcon, Cross2Icon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { CryptoAssetIcon } from "./crypto-asset-icon";
import { Input } from "@/components/ui/input";

export type TokenPickerItem = {
  id: string;
  symbol: string;
  name: string;
  chain: string;
  address: string;
  icon?: string;
};

function short(value: string) {
  return value.length > 18 ? `${value.slice(0, 7)}…${value.slice(-6)}` : value;
}

export function TokenPicker({
  items,
  value,
  onChange,
  label,
  disabledIds = [],
}: {
  items: readonly TokenPickerItem[];
  value: TokenPickerItem;
  onChange: (item: TokenPickerItem) => void;
  label: string;
  disabledIds?: readonly string[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();

  const closePicker = useCallback(({ restoreFocus = true }: { restoreFocus?: boolean } = {}) => {
    setOpen(false);
    setQuery("");
    if (restoreFocus) window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePicker();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) closePicker({ restoreFocus: false });
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 40);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [closePicker, open]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => `${item.symbol} ${item.name} ${item.chain} ${item.address}`.toLowerCase().includes(normalized));
  }, [items, query]);

  function choose(item: TokenPickerItem) {
    if (disabledIds.includes(item.id)) return;
    onChange(item);
    closePicker();
  }

  function focusOption(fromIndex: number, direction: 1 | -1) {
    if (!filtered.length) return;
    for (let offset = 1; offset <= filtered.length; offset += 1) {
      const index = (fromIndex + direction * offset + filtered.length) % filtered.length;
      const item = filtered[index];
      if (item && !disabledIds.includes(item.id)) { optionRefs.current[index]?.focus(); return; }
    }
  }

  function focusEdge(edge: "first" | "last") {
    const indices = edge === "first" ? filtered.map((_, index) => index) : filtered.map((_, index) => index).reverse();
    const index = indices.find((candidate) => { const item = filtered[candidate]; return item && !disabledIds.includes(item.id); });
    if (index !== undefined) optionRefs.current[index]?.focus();
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { if (open) closePicker(); else setOpen(true); }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        className="pc-token-trigger flex min-w-[144px] max-w-full items-center gap-2.5 rounded-[var(--pc-radius-control)] border border-slate-200 bg-white px-3 py-2.5 text-left text-slate-950 shadow-[0_4px_14px_rgba(7,16,13,.045)] transition-all duration-200 hover:border-[#9fb2a9] hover:shadow-[0_8px_22px_rgba(7,16,13,.075)] dark:border-white/10 dark:bg-white/[.055] dark:text-white dark:hover:border-white/20"
      >
        <CryptoAssetIcon token={value} size={30} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">{value.symbol}</span>
          <span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">{value.chain} · {value.name}</span>
        </span>
        <ChevronDownIcon className={`size-4 shrink-0 text-[#294a3b] transition-transform dark:text-[#d0dcd6] ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <>
          <button type="button" aria-label="Close token selector" onClick={() => closePicker()} className="fixed inset-0 z-[89] bg-black/35 backdrop-blur-[2px] sm:hidden" />
          <section
            role="dialog"
            aria-modal="false"
            aria-label={label}
            className="pc-review-sheet fixed inset-x-2 bottom-2 z-[90] max-h-[72vh] overflow-hidden rounded-[var(--pc-radius-panel)] text-slate-950 sm:absolute sm:inset-auto sm:right-0 sm:top-[calc(100%+.55rem)] sm:w-[390px] sm:max-h-none dark:text-white"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-4 py-4 dark:border-white/8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#557568] dark:text-[#b9c8c1]">Trusted assets</p>
                <h3 className="mt-1 text-base font-semibold tracking-tight">Select token</h3>
              </div>
              <button type="button" onClick={() => closePicker()} className="grid size-8 place-items-center rounded-[var(--pc-radius-control)] border border-slate-200 bg-white text-[#294a3b] transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/[.04] dark:text-[#d0dcd6]" aria-label="Close token selector">
                <Cross2Icon />
              </button>
            </div>

            <div className="p-3">
              <div className="relative mb-2.5">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#557568]" />
                <Input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); focusEdge("first"); } else if (event.key === "ArrowUp") { event.preventDefault(); focusEdge("last"); } }} placeholder="Search token, chain or address" aria-label="Search tokens" className="pl-9" />
              </div>

              <div id={listboxId} className="no-scrollbar max-h-[min(420px,52vh)] space-y-1 overflow-y-auto" role="listbox" aria-label={`${label} options`}>
                {filtered.map((item, index) => {
                  const selected = item.id === value.id;
                  const disabled = disabledIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      ref={(node) => { optionRefs.current[index] = node; }}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      disabled={disabled}
                      onClick={() => choose(item)}
                      onKeyDown={(event) => {
                        if (event.key === "ArrowDown") { event.preventDefault(); focusOption(index, 1); }
                        else if (event.key === "ArrowUp") { event.preventDefault(); focusOption(index, -1); }
                        else if (event.key === "Home") { event.preventDefault(); focusEdge("first"); }
                        else if (event.key === "End") { event.preventDefault(); focusEdge("last"); }
                        else if (event.key === "Escape") { event.preventDefault(); closePicker(); }
                      }}
                      className={`group flex w-full items-center gap-3 rounded-[var(--pc-radius-control)] border px-3 py-3 text-left transition ${selected ? "border-[#a8bbb2] bg-[#f1f5f2] dark:border-[#6f8f80]/60 dark:bg-white/[.07]" : "border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-white/8 dark:hover:bg-white/[.045]"} disabled:cursor-not-allowed disabled:opacity-35`}
                    >
                      <CryptoAssetIcon token={item} size={36} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <strong className="text-sm">{item.symbol}</strong>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#557568] ring-1 ring-slate-200 dark:bg-white/[.06] dark:text-slate-400 dark:ring-white/10">{item.chain}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">{item.name}</span>
                        <span className="mt-1 block truncate font-mono text-[9px] text-slate-400">{short(item.address)}</span>
                      </span>
                      {selected ? <span className="grid size-7 place-items-center rounded-full bg-[#173b2d] text-white dark:bg-[#d0dcd6] dark:text-[#0b1511]"><CheckIcon /></span> : <span className="text-[#557568] opacity-0 transition group-hover:opacity-100">→</span>}
                    </button>
                  );
                })}
                {filtered.length === 0 ? <div className="rounded-[var(--pc-radius-card)] border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-white/10">No matching trusted token.</div> : null}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
