"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useUserSettings } from "@/context/user-settings-context";
import { APP_ROUTES } from "@/config/app-routes";
import { NavigationIcon } from "./navigation-icon";

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { settings } = useUserSettings();
  const initial = settings.profile.displayName.trim().slice(0,1).toUpperCase() || "P";
  useEffect(()=>{ if(!open)return; const close=(event:PointerEvent)=>{if(ref.current&&!ref.current.contains(event.target as Node))setOpen(false)}; const key=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false)}; window.addEventListener("pointerdown",close);window.addEventListener("keydown",key);return()=>{window.removeEventListener("pointerdown",close);window.removeEventListener("keydown",key)}},[open]);
  return <div className="relative" ref={ref}><button type="button" onClick={()=>setOpen(value=>!value)} aria-expanded={open} aria-label="Open profile menu" className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#294a3b] transition hover:border-[#9eafa7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:border-white/10 dark:bg-white/[.04] dark:text-[#d0dcd6]">{initial}</button>{open?<div className="pc-review-sheet absolute right-0 top-12 z-50 w-64 rounded-2xl p-2"><div className="px-3 py-2"><p className="truncate text-sm font-semibold">{settings.profile.displayName||"PowerChain user"}</p><p className="mt-0.5 text-[11px] text-slate-500">Local profile · wallet-controlled actions</p></div><div className="my-1 border-t border-slate-200 dark:border-white/10"/><Link href={APP_ROUTES.profile} onClick={()=>setOpen(false)} className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium hover:bg-slate-100 dark:hover:bg-white/[.05]"><NavigationIcon name="profile" className="size-4"/>Profile</Link><Link href={APP_ROUTES.settings} onClick={()=>setOpen(false)} className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium hover:bg-slate-100 dark:hover:bg-white/[.05]"><NavigationIcon name="settings" className="size-4"/>Settings</Link></div>:null}</div>;
}
