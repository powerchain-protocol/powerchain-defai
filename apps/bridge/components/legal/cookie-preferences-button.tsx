"use client";

import { requestCookieChoices } from "@/hooks/use-cookies";

export function CookiePreferencesButton() {
  return <button type="button" onClick={requestCookieChoices} className="text-slate-500 transition hover:text-[#264b3b] dark:text-slate-400 dark:hover:text-[#d9e3de]">Cookie choices</button>;
}
